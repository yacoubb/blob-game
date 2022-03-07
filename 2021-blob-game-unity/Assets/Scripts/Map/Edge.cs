using System.Collections;
using System.Collections.Generic;
using Mirror;
using UnityEngine;

namespace BlobGame
{
  namespace Map
  {
    public class Edge : Mirror.NetworkBehaviour
    {
      const float EDGE_WIDTH = 0.3f;
      readonly Color EDGE_COLOR = new Color(0.2f, 0.2f, 0.2f);

      public enum EdgeNodeIndex
      {
        A,
        B
      }

      [SyncVar(hook = nameof(OnNodeChangedA))]
      public GameObject nodeA;
      [SyncVar(hook = nameof(OnNodeChangedB))]
      public GameObject nodeB;

      void OnNodeChangedA(GameObject oldNodeA, GameObject newNodeA)
      {
        this.nodeA = newNodeA;
        this.a = newNodeA.GetComponent<Node>();
      }

      void OnNodeChangedB(GameObject oldNodeB, GameObject newNodeB)
      {
        this.nodeB = newNodeB;
        this.b = newNodeB.GetComponent<Node>();
      }

      Node a;
      Node b;

      [Server]
      public static Edge CreateEdge(Node a, Node b)
      {
        GameObject edgeObject = GameObject.Instantiate(NetworkManager.FindPrefab("Edge"));
        edgeObject.name = $"Edge({a.gameObject.name},{b.gameObject.name})";
        Edge edge = edgeObject.GetComponent<Edge>();
        edge.OnNodeChangedA(null, a.gameObject);
        edge.OnNodeChangedB(null, b.gameObject);
        Debug.Log($"CreateEdge got nodes: {edge.nodeA} {edge.nodeB}");
        NetworkServer.Spawn(edgeObject);
        return edge;
      }

      LineRenderer lineRenderer;
      CapsuleCollider2D[] capsuleColliders;
      private void Start()
      {
        Debug.Log($"{this.gameObject.name}.Start()");
        Debug.Log(this.nodeA);
        Debug.Log(this.nodeB);
        lineRenderer = this.GetComponentInChildren<LineRenderer>();
        lineRenderer.positionCount = 2;
        lineRenderer.startWidth = EDGE_WIDTH;
        lineRenderer.endWidth = EDGE_WIDTH;
        lineRenderer.startColor = EDGE_COLOR;
        lineRenderer.endColor = EDGE_COLOR;

        capsuleColliders = this.GetComponentsInChildren<CapsuleCollider2D>();
        if (capsuleColliders.Length != 2)
        {
          throw new System.Exception("Edge.capsuleColliders doesnt have length 2");
        }
        capsuleColliders[(int)EdgeNodeIndex.A].GetComponent<EdgeCollider>().parentEdge = this;
        capsuleColliders[(int)EdgeNodeIndex.A].GetComponent<EdgeCollider>().colliderFor = EdgeNodeIndex.A;
        capsuleColliders[(int)EdgeNodeIndex.B].GetComponent<EdgeCollider>().parentEdge = this;
        capsuleColliders[(int)EdgeNodeIndex.B].GetComponent<EdgeCollider>().colliderFor = EdgeNodeIndex.B;
      }

      // TODO update this to only be called when node positions change
      private void Update()
      {
        if (lineRenderer)
        {
          lineRenderer.SetPosition(0, nodeA.transform.position);
          lineRenderer.SetPosition(1, nodeB.transform.position);
        }

        Vector2 edgeDir = nodeB.transform.position - nodeA.transform.position;

        capsuleColliders[(int)EdgeNodeIndex.A].size = new Vector2(EDGE_WIDTH, edgeDir.magnitude / 2f);
        capsuleColliders[(int)EdgeNodeIndex.B].size = new Vector2(EDGE_WIDTH, edgeDir.magnitude / 2f);

        capsuleColliders[(int)EdgeNodeIndex.A].transform.position = (Vector2)nodeA.transform.position + edgeDir * 0.25f;
        capsuleColliders[(int)EdgeNodeIndex.B].transform.position = (Vector2)nodeA.transform.position + edgeDir * 0.75f;

        var rot = Quaternion.FromToRotation(Vector2.up, edgeDir);
        capsuleColliders[(int)EdgeNodeIndex.A].transform.rotation = rot;
        capsuleColliders[(int)EdgeNodeIndex.B].transform.rotation = rot;
      }

      [Command(requiresAuthority = false)]
      public void CmdColliderClicked(EdgeNodeIndex nodeIndex, NetworkConnectionToClient sender = null)
      {
        Debug.Log($"Edge.ColliderClicked({nodeIndex})");
        // var player = (NetworkAuthenticator.PlayerAuthMetadata)connectionToClient.authenticationData;
        var player = (NetworkAuthenticator.PlayerAuthMetadata)sender.authenticationData;
        if (nodeIndex == EdgeNodeIndex.A && a.team == player.playerIndex)
        {
          a.SpawnBlob(this, nodeIndex);
        }
        if (nodeIndex == EdgeNodeIndex.B && b.team == player.playerIndex)
        {
          b.SpawnBlob(this, nodeIndex);
        }
      }
    }
  }
}
