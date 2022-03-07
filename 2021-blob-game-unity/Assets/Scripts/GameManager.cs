using Mirror;
using UnityEngine;

namespace BlobGame
{
  [System.Serializable]
  class GameConfig
  {
    public BlobGame.NetworkAuthenticator.PlayerAuthMetadata[] players;
    public int port;
  }

  public class GameManager : MonoBehaviour
  {
    public static bool gameStarted;
    public static void StartGame(int playerCount)
    {
      if (!gameStarted)
      {
        gameStarted = true;
        Debug.Log($"GameManager.StartGame({playerCount})");
        BlobGame.Map.Generator.Generate(playerCount);
      }
    }

    private void Awake()
    {
      var args = System.Environment.GetCommandLineArgs();
      foreach (var arg in args)
      {
        // var arg = "{\"players\": [{\"accessToken\": \"first\", \"playerIndex\": 0, \"username\": \"yacoub\"}]}";
        if (arg.StartsWith('{'))
        {
          Debug.Log("GameManager.Awake() setting config from CLI");
          Debug.LogError(arg);
          Debug.Log(arg);
          GameConfig gameConfig = JsonUtility.FromJson<GameConfig>(arg);
          Debug.Log(gameConfig.players.Length);
          foreach (var player in gameConfig.players)
          {
            Debug.Log(player.ToString());
          }
          GetComponent<NetworkAuthenticator>().SetPlayers(gameConfig.players);
          Debug.Log($"Setting port to {gameConfig.port} => {System.Convert.ToUInt16(gameConfig.port)}");
          GetComponent<Mirror.SimpleWeb.SimpleWebTransport>().port = System.Convert.ToUInt16(gameConfig.port);
          GetComponent<NetworkManager>().StartServer();
        }
      }
    }

    private void OnEnable()
    {
      ((NetworkManager)NetworkManager.singleton).OnServerAddedPlayer.AddListener(conn => CheckIfServerShouldDie(10));
      ((NetworkManager)NetworkManager.singleton).OnServerDisconnected.AddListener(conn => CheckIfServerShouldDie(10));

      CheckIfServerShouldDie(30);
    }

    void CheckIfServerShouldDie(int timeout)
    {
      Debug.Log($"CheckIfServerShouldDie({NetworkManager.singleton.numPlayers})");
      if (NetworkManager.singleton.numPlayers == 0)
      {
        Debug.Log($"Killing server in {timeout} seconds");
        Invoke(nameof(KillServer), timeout);
      }
      else
      {
        Debug.Log("Cancelling any queued server kill request");
        CancelInvoke();
      }
    }

    void KillServer()
    {
      Debug.Log("KillServer()");
      NetworkManager.singleton.StopServer();
    }
  }
}
