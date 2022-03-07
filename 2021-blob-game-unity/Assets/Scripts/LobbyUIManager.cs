using System.Collections;
using Mirror;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace BlobGame
{
  public class LobbyUIManager : MonoBehaviour
  {
    private void DisableLoginCanvas()
    {
      GameObject.Find("LoginCanvas").SetActive(false);
    }

    public void SetAuthToken(string authToken)
    {
      NetworkAuthenticator.clientAccessToken = authToken;
    }

    public void SetServerAddress(string address)
    {
      NetworkManager.singleton.networkAddress = address;
    }

    public void StartClient()
    {
      NetworkManager.singleton.StartClient();
    }

    private void Awake()
    {
      NetworkManager.onServerOrClientStart += DisableLoginCanvas;
#if UNITY_EDITOR
      GetComponent<NetworkManagerHUD>().enabled = true;
      Debug.Log("Setting UI callbacks");
      GameObject.FindObjectOfType<Canvas>().gameObject.SetActive(true);
      GameObject.Find("AuthcodeInput").GetComponent<TMPro.TMP_InputField>().onValueChanged.AddListener(SetAuthToken);
      GameObject.Find("AddressInput").GetComponent<TMPro.TMP_InputField>().onValueChanged.AddListener(SetServerAddress);
      GameObject.Find("StartClientButton").GetComponent<Button>().onClick.AddListener(StartClient);
#endif
    }

    public static void SpawnLobbyIcons(BlobGame.NetworkAuthenticator.PlayerAuthMetadata[] playerList)
    {
      Debug.Log($"SpawnLobbyIcons({playerList.Length})");
      for (int x = 0; x < playerList.Length; x++)
      {
        GameObject playerLobbyIcon = GameObject.Instantiate(NetworkManager.FindPrefab("LobbyPlayerStatus"), new Vector3((x - playerList.Length / 2) * 2, 2, 0), Quaternion.identity);
        LobbyPlayerStatus lobbyPlayerStatus = playerLobbyIcon.GetComponent<LobbyPlayerStatus>();
        lobbyPlayerStatus.SetColorAndPlayer(Color.red, playerList[x]);
        Debug.Log($"Spawning lobby player symbol index {x}");
        NetworkServer.Spawn(playerLobbyIcon);
        GameObject.FindObjectOfType<Mirror.NetworkAuthenticator>().OnServerAuthenticated.AddListener((conn) =>
        {
          var playerData = (NetworkAuthenticator.PlayerAuthMetadata)conn.authenticationData;
          if (playerData.accessToken == lobbyPlayerStatus.player.accessToken)
          {
            lobbyPlayerStatus.SetColor(Color.green);
          }
        });
        GameObject.FindObjectOfType<NetworkManager>().OnServerDisconnected.AddListener((conn) =>
        {
          if (conn.isAuthenticated)
          {
            var playerData = (NetworkAuthenticator.PlayerAuthMetadata)conn.authenticationData;
            if (playerData.accessToken == lobbyPlayerStatus.player.accessToken)
            {
              lobbyPlayerStatus.SetColor(Color.red);
            }
          }
        });
      }
    }
  }
}
