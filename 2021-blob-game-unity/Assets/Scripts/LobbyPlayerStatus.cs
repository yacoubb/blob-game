using Mirror;
using TMPro;
using UnityEngine;

namespace BlobGame
{
  class LobbyPlayerStatus : NetworkBehaviour
  {
    [SyncVar(hook = nameof(OnColorChangedHook))]
    public Color color;

    [SyncVar(hook = nameof(OnPlayerChangedHook))]
    public NetworkAuthenticator.PlayerAuthMetadata player;

    public override void OnStartClient()
    {
      Debug.Log($"LobbyPlayerStatus started with color {color.r} {color.g} {color.b}");
    }

    public void SetColor(Color color)
    {
      OnColorChangedHook(this.color, color);
      this.color = color;
    }

    public void SetColorAndPlayer(Color color, NetworkAuthenticator.PlayerAuthMetadata player)
    {
      OnColorChangedHook(this.color, color);
      OnPlayerChangedHook(this.player, player);
      this.color = color;
      this.player = player;
    }

    private void OnColorChangedHook(Color _old, Color _new)
    {
      if (_old != _new)
      {
        GetComponent<SpriteRenderer>().color = _new;
      }
    }

    private void OnPlayerChangedHook(NetworkAuthenticator.PlayerAuthMetadata _old, NetworkAuthenticator.PlayerAuthMetadata _new)
    {
      this.gameObject.name = _new.username;
      GetComponentInChildren<TextMeshPro>().SetText(_new.username);
    }
  }
}