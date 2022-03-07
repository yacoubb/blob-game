using System.Collections;
using System.Collections.Generic;
using Mirror;
using UnityEngine;

namespace BlobGame
{
  namespace Map
  {
    public class Node : BlobLike
    {
      public const int NEUTRAL_TEAM = -1;
      public const int PLAYER_START_MASS = 50;
      public const int NEUTRAL_START_MASS = 20;

      [SyncVar]
      public float x;
      [SyncVar]
      public float y;

      public Vector2 pos { get => new Vector2(this.x, this.y); }

      [Server]
      public static Node CreateNode(float x, float y, float mass, int team = NEUTRAL_TEAM)
      {
        // should only be called on the server
        Debug.Log("Node.CreateNode()");
        GameObject nodeObject = GameObject.Instantiate(NetworkManager.FindPrefab("Node"));
        nodeObject.name = $"Node({x},{y})";
        Node node = nodeObject.GetComponent<Node>();
        node.x = x;
        node.y = y;
        node.mass = mass;
        node.team = team;
        NetworkServer.Spawn(nodeObject);
        return node;
      }

      private void OnEnable()
      {
        CameraResizer.onCameraReiszed += this.SetNodePosition;
      }

      private void OnDisable()
      {
        CameraResizer.onCameraReiszed -= this.SetNodePosition;
      }

      override protected void Start()
      {
        base.Start();
        Debug.Log($"Node.Start({x}, {y})");
        rigidbody2D.bodyType = RigidbodyType2D.Kinematic;
        rigidbody2D.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
        circleCollider.isTrigger = true;

        var (bottomLeft, bounds) = CameraResizer.GetCameraBounds();
        SetNodePosition(bottomLeft, bounds);
        if (isServer)
        {
          SetNodeGrowthRate();
        }
      }

      private void SetNodePosition(Vector2 bottomLeft, Vector2 bounds)
      {
        const float OFFSET_AMOUNT = 0.1f;
        Vector2 gridPosition = new Vector2(this.x * bounds.x, this.y * bounds.y);
        Vector2 gridPositionWithOffset = bounds * OFFSET_AMOUNT + gridPosition * (1f - 2f * OFFSET_AMOUNT);

        Vector2 worldPosition = bottomLeft + gridPositionWithOffset;

        this.transform.position = worldPosition;
      }

      float growInterval = 1;
      float growAmount;
      float growTimer = 0;

      [Server]
      private void SetNodeGrowthRate()
      {
        // if this is a player's starting node
        if (this.team != NEUTRAL_TEAM)
        {
          growInterval = 2;
          growTimer = growInterval;
          growAmount = 10;
        }
        else
        {
          float distFromCenter = Vector2.Distance(this.pos, Vector2.one * 0.5f);

          growInterval = BlobGame.BlobMath.randomNormal(2 + 4 * distFromCenter, .4f);
          growTimer = growInterval;
          growAmount = BlobGame.BlobMath.randomNormal(10f, 2f);
        }
      }

      override protected void Update()
      {
        base.Update();
        if (isServer)
        {
          growTimer -= Time.deltaTime;
          if (growTimer <= 0)
          {
            growTimer = growInterval;
            this.Grow(growAmount);
          }
          // this.Grow(Time.deltaTime * 3);
        }
      }

      [Server]
      public void Grow(float amount)
      {
        this.SetMass(this.mass + amount);
      }

      [Server]
      public void SpawnBlob(Edge edgeAlong, Edge.EdgeNodeIndex thisNodeIndex)
      {
        float halfMass = this.mass / 2f;
        if (halfMass >= 1f)
        {
          Blob.CreateBlob(this.team, mass: halfMass, parentEdge: edgeAlong, movingAtoB: thisNodeIndex == Edge.EdgeNodeIndex.A);
          this.SetMass(this.mass - halfMass);
        }
      }

      const float MAX_MASS_LIMIT = 200;
      [Server]
      public void CollidedWithBlob(float mass, int sourceBlobTeam)
      {
        if (this.team == sourceBlobTeam)
        {
          // if we collide with a blob with enormous mass, increase our max mass
          if (mass > this.maxMass)
          {
            this.maxMass = Mathf.Min(mass, MAX_MASS_LIMIT);
          }
          this.SetMass(this.mass + mass);
        }
        else
        {
          this.SetMass(this.mass - mass);
          if (this.mass <= 0)
          {
            this.SetMass(-this.mass);
            this.team = sourceBlobTeam;
          }
        }
      }
    }
  }
}
