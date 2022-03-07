using UnityEngine;

namespace BlobGame
{
  public class CameraRaycaster : MonoBehaviour
  {
    private void Update()
    {
      if (Input.GetMouseButtonDown(0))
      {
        Debug.Log("Camraycasting");
        RaycastHit2D[] hits = Physics2D.GetRayIntersectionAll(Camera.main.ScreenPointToRay(Input.mousePosition), 20f, 1 << LayerMask.NameToLayer("Edge"));
        Debug.Log(hits.Length);

        if (hits.Length > 0)
        {
          if (hits.Length > 1)
          {
            // TODO consider what to do when we click multiple edges?
            Debug.LogWarning("Hit multiple edges, not sure what to do so returning");
            return;
          }
          hits[0].collider.gameObject.GetComponent<BlobGame.Map.EdgeCollider>().OnClick();
        }
      }
    }
  }
}