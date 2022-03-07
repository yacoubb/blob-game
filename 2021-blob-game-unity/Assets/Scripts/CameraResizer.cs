using UnityEngine;

namespace BlobGame
{
  public class CameraResizer : MonoBehaviour
  {
    public delegate void OnCameraResized(Vector2 bottomLeft, Vector2 bounds);
    public static event OnCameraResized onCameraReiszed;

    new Camera camera;

    Vector2 lastCameraPos;
    Vector2 resolution;

    private void Awake()
    {
      camera = Camera.main;
      Update();
    }

    public static (Vector2, Vector2) GetCameraBounds()
    {
      // local scope these variables to avoid a possible bug where we call GetCameraBounds, update global variables and cause onCameraResized to not be invoked when it should
      Vector2 lastCameraPos = Camera.main.transform.parent.position;

      Vector2 resolution = new Vector2(Screen.width, Screen.height);
      Vector2 bounds = new Vector2((float)Screen.width / (float)Screen.height * Camera.main.orthographicSize * 2f, Camera.main.orthographicSize * 2f);

      return ((Vector2)lastCameraPos - bounds / 2f, bounds);
    }

    private void Update()
    {
      if (Screen.width != resolution.x
          || Screen.height != resolution.y
          || (Vector2)camera.transform.parent.position != lastCameraPos)
      {
        Debug.Log("Screen bounds changed");
        lastCameraPos = (Vector2)camera.transform.parent.position;
        resolution = new Vector2(Screen.width, Screen.height);

        var (bottomLeft, bounds) = GetCameraBounds();

        // Debug.Log($"{bottomLeft.ToString()} {bounds.ToString()}");
        onCameraReiszed?.Invoke(bottomLeft, bounds);
      }
    }

  }
}