using System;
using System.Collections;
using System.Collections.Generic;
using Mirror;
using UnityEngine;

/*
    Documentation: https://mirror-networking.gitbook.io/docs/components/network-authenticators
    API Reference: https://mirror-networking.com/docs/api/Mirror.NetworkAuthenticator.html
*/
namespace BlobGame
{
  public class NetworkAuthenticator : Mirror.NetworkAuthenticator
  {
    #region Messages

    public struct AuthRequestMessage : NetworkMessage
    {
      public readonly string accessToken;
      public AuthRequestMessage(string accessToken)
      {
        this.accessToken = accessToken;
      }
    }

    public struct AuthResponseMessage : NetworkMessage
    {
      public readonly bool accepted;
      public readonly PlayerAuthMetadata playerAuth;
      public AuthResponseMessage(bool accepted, PlayerAuthMetadata playerAuth)
      {
        this.accepted = accepted;
        this.playerAuth = playerAuth;
      }
      public AuthResponseMessage(bool accepted)
      {
        this.accepted = accepted;
        this.playerAuth = new PlayerAuthMetadata();
      }
    }

    #endregion

    #region Server
    [System.Serializable]
    public struct PlayerAuthMetadata
    {
      public string accessToken;
      public int playerIndex;
      public string username;

      public PlayerAuthMetadata(string accessToken, int playerIndex, string username)
      {
        this.accessToken = accessToken;
        this.playerIndex = playerIndex;
        this.username = username;
      }

      public override string ToString()
      {
        return $"{this.username} index {this.playerIndex} token [{this.accessToken}]";
      }
    }

    public static PlayerAuthMetadata[] expectedPlayers = new PlayerAuthMetadata[] {
        new PlayerAuthMetadata("first", 0, "firstGuy"),
        new PlayerAuthMetadata("second", 1, "secondGuy")
      };
    Dictionary<string, PlayerAuthMetadata> expectedPlayersDict;
    PlayerAuthMetadata clientAuth;

    public void SetPlayers(PlayerAuthMetadata[] playerConfig)
    {
      expectedPlayers = playerConfig;
    }

    public static string clientAccessToken = "Insert access token";

    /// <summary>
    /// Called on server from StartServer to initialize the Authenticator
    /// <para>Server message handlers should be registered in this method.</para>
    /// </summary>
    public override void OnStartServer()
    {
      Debug.Log("Authenticator.OnStartServer()");
      // register a handler for the authentication request we expect from client
      NetworkServer.RegisterHandler<AuthRequestMessage>(OnAuthRequestMessage, false);
      OnServerAuthenticated.AddListener((conn) => { Debug.Log($"OnServerAuthenticated({((NetworkAuthenticator.PlayerAuthMetadata)conn.authenticationData).username})"); });
      expectedPlayersDict = new Dictionary<string, PlayerAuthMetadata>();
      foreach (var player in expectedPlayers)
      {
        expectedPlayersDict.Add(player.accessToken, player);
      }
      GetComponent<NetworkManager>().OnServerDisconnected.AddListener((conn) =>
      {
        if (conn.isAuthenticated)
        {
          PlayerAuthMetadata player = (PlayerAuthMetadata)conn.authenticationData;
          if (expectedPlayersDict.ContainsKey(player.accessToken))
          {
            throw new Exception($"expectedPlayersDict contains key for a player that is leaving?");
          }
          expectedPlayersDict.Add(player.accessToken, player);
        }
      });
    }

    /// <summary>
    /// Called on server from OnServerAuthenticateInternal when a client needs to authenticate
    /// </summary>
    /// <param name="conn">Connection to client.</param>
    public override void OnServerAuthenticate(NetworkConnectionToClient conn)
    {
      // Debug.Log($"OnServerAuthenticate({conn.authenticationData.ToString()} {(string)conn.authenticationData})");
    }

    /// <summary>
    /// Called on server when the client's AuthRequestMessage arrives
    /// </summary>
    /// <param name="conn">Connection to client.</param>
    /// <param name="msg">The message payload</param>
    public void OnAuthRequestMessage(NetworkConnectionToClient conn, AuthRequestMessage msg)
    {
      Debug.Log($"OnAuthRequestMessage({msg.accessToken})");
      if (expectedPlayersDict.ContainsKey(msg.accessToken))
      {
        AuthResponseMessage authResponseMessage = new AuthResponseMessage(true, expectedPlayersDict[msg.accessToken]);
        conn.authenticationData = expectedPlayersDict[msg.accessToken];
        conn.Send(authResponseMessage);
        // Remove the expected player to not receive them twice
        expectedPlayersDict.Remove(msg.accessToken);
        // Accept the successful authentication
        ServerAccept(conn);
        if (expectedPlayersDict.Count == 0)
        {
          // GetComponent<GameManager>().StartGame(expectedPlayers.Length);
          GameManager.StartGame(expectedPlayers.Length);
        }
      }
      else
      {
        AuthResponseMessage authResponseMessage = new AuthResponseMessage(false);
        conn.Send(authResponseMessage);
        ServerReject(conn);
      }

    }

    #endregion

    #region Client

    /// <summary>
    /// Called on client from StartClient to initialize the Authenticator
    /// <para>Client message handlers should be registered in this method.</para>
    /// </summary>
    public override void OnStartClient()
    {
      // register a handler for the authentication response we expect from server
      NetworkClient.RegisterHandler<AuthResponseMessage>(OnAuthResponseMessage, false);
    }

    /// <summary>
    /// Called on client from OnClientAuthenticateInternal when a client needs to authenticate
    /// </summary>
    public override void OnClientAuthenticate()
    {
      if (clientAccessToken == null)
      {
        throw new Exception("NetworkAuthenticator.clientAccessToken not set before OnClientAuthenticate");
      }
      AuthRequestMessage authRequestMessage = new AuthRequestMessage(clientAccessToken);

      NetworkClient.Send(authRequestMessage);
    }

    /// <summary>
    /// Called on client when the server's AuthResponseMessage arrives
    /// </summary>
    /// <param name="msg">The message payload</param>
    public void OnAuthResponseMessage(AuthResponseMessage msg)
    {
      if (msg.accepted)
      {
        // Authentication has been accepted
        clientAuth = msg.playerAuth;
        Debug.LogError($"Client auth accepted, logged in as {msg.playerAuth.username} {msg.playerAuth.playerIndex}");
        ClientAccept();
      }
      else
      {
        Debug.LogError($"Client auth rejected");
        ClientReject();
      }
    }

    #endregion
  }
}
