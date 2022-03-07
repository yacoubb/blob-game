using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace BlobGame
{
  namespace Map
  {
    public class EdgeCollider : MonoBehaviour
    {
      public Edge parentEdge;
      public Edge.EdgeNodeIndex colliderFor;

      public void OnClick()
      {
        if (this.parentEdge)
        {
          this.parentEdge.CmdColliderClicked(nodeIndex: this.colliderFor);
        }
        else
        {
          Debug.LogWarning("EdgeCollider clicked with no parent edge attached");
        }
      }
    }
  }
}
