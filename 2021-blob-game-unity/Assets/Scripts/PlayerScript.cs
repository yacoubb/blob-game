using Mirror;
using UnityEngine;

namespace BlobGame
{
  public class PlayerScript : Mirror.NetworkBehaviour
  {
    const float SPEED = 1f;
    public override void OnStartLocalPlayer()
    {
      Camera.main.transform.SetParent(this.transform);
      Camera.main.transform.localPosition = new Vector3(0, 0, -10);
    }

    public override void OnStopClient()
    {
      Camera.main.transform.SetParent(null);
      Camera.main.transform.position = new Vector3(0, 0, -10);
      base.OnStopClient();
    }

    // void Update()
    // {
    //   if (!this.isLocalPlayer) { return; }

    //   float moveX = Input.GetAxis("Horizontal") * Time.deltaTime * SPEED;
    //   float moveY = Input.GetAxis("Vertical") * Time.deltaTime * SPEED;

    //   transform.Translate(new Vector2(moveX, moveY));
    // }
  }
}
