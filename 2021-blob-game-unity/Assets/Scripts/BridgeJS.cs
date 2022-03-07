using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace BlobGame
{
  public class BridgeJS : MonoBehaviour
  {
    public void SetServerAddress(string serverAddress)
    {
      Debug.Log($"SetServerAddress({serverAddress})");
      NetworkManager.singleton.networkAddress = serverAddress;
    }

    public void SetPort(int port)
    {
      Debug.Log($"SetPort({port})");
      NetworkManager.singleton.GetComponent<Mirror.SimpleWeb.SimpleWebTransport>().port = System.Convert.ToUInt16(port);
    }

    public void SetAccessToken(string accessToken)
    {
      Debug.Log($"SetAccessToken({accessToken})");
      NetworkAuthenticator.clientAccessToken = accessToken;
    }

    public void ConnectClient()
    {
      Debug.Log($"ConnectClient()");
      NetworkManager.singleton.StartClient();
    }
  }
}
