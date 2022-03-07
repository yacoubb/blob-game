using System.Collections;
using System.Collections.Generic;
using Mirror;
using UnityEngine;

namespace BlobGame
{
  namespace Map
  {
    public class Blob : BlobLike
    {
      const float SPEED = 1f / 4f;


      [SyncVar]
      public float progress;

      // TODO syncvar seems to set these to null when initialising blobs iwth CreateBlob
      // will cause problems with users joining late - blobs will have no parent
      // TODO try adding SyncVar back since we updated to newer mirror version?
      public GameObject sourceNode;
      public GameObject targetNode;

      [Server]
      public static Blob CreateBlob(int team, float mass, Edge parentEdge, bool movingAtoB)
      {
        Debug.Log($"CreateBlob({team}, {mass}, {parentEdge}, {movingAtoB})");
        var (sourceNode, targetNode) = movingAtoB ? (parentEdge.nodeA, parentEdge.nodeB) : (parentEdge.nodeB, parentEdge.nodeA);
        GameObject blobject = GameObject.Instantiate(NetworkManager.FindPrefab("Blob"));
        // GameObject blobject = GameObject.Instantiate(NetworkManager.FindPrefab("Blob"), sourceNode.transform.position, Quaternion.identity);
        Blob blob = blobject.GetComponent<Blob>();
        blob.team = team;
        blob.mass = mass;
        blob.progress = 0;
        blob.sourceNode = sourceNode;
        blob.targetNode = targetNode;
        Debug.Log(blob.GetComponent<Collider2D>());
        Debug.Log(blob.sourceNode);
        Debug.Log(blob.sourceNode.GetComponent<Collider2D>());
        Physics2D.IgnoreCollision(
          blob.GetComponent<Collider2D>(),
          blob.sourceNode.GetComponent<Collider2D>()
        );
        // force update call to set position and radius properly
        blob.Update();
        NetworkServer.Spawn(blobject);

        blob.RpcSetNodes(sourceNode, targetNode);

        return blob;
      }

      [ClientRpc]
      public void RpcSetNodes(GameObject sourceNode, GameObject targetNode)
      {
        Debug.Log("ClientRPC RpcSetNodes called");
        this.sourceNode = sourceNode;
        this.targetNode = targetNode;
        Debug.Log(this.sourceNode);
        Debug.Log(this.targetNode);
      }

      private void Awake()
      {
        circleCollider.enabled = false;
        IEnumerator enableRigidbodyAfterDelay()
        {
          yield return new WaitForSeconds(0.2f);
          circleCollider.enabled = true;
        }
        StartCoroutine(enableRigidbodyAfterDelay());
      }

      override protected void Start()
      {
        base.Start();
        rigidbody2D.bodyType = RigidbodyType2D.Kinematic;
        rigidbody2D.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
        circleCollider.isTrigger = true;
        transform.position = sourceNode.transform.position;
      }

      Vector3 lastDirection;

      private void FixedUpdate()
      {
        // server is authoritative, keeps clients in sync, but let clients update their local progress variables for prediction purposes
        if (isServer || isClient)
        {
          // TODO heavier blobs move slower?
          progress += SPEED * Time.fixedDeltaTime * MAX_MASS / (this.mass + MAX_MASS / 2f);
        }
        Vector3 targetPosition = sourceNode.transform.position + (targetNode.transform.position - sourceNode.transform.position) * progress;
        // transform.Translate(targetPosition - transform.position);
        lastDirection = targetPosition - transform.position;
        rigidbody2D.MovePosition(targetPosition);
        // if (isServer)
        // {
        //   rigidbody2D.MovePosition(targetPosition);
        // }
        // else
        // {
        //   rigidbody2D.MovePosition(Vector3.Lerp(transform.position, targetPosition, 0.1f));
        // }
      }

      // TODO node deaths should be events and handled by a separate UI component
      [Server]
      void DieFromCollision(float massBeforeCollision, GameObject collidedWith)
      {
        Debug.Log($"Blob.DieFromCollision({collidedWith.gameObject.name})");
        Destroy(this.gameObject);
        RpcSpawnDeathParticles(massBeforeCollision, collidedWith);
        if (isClient && !isClientOnly)
        {
          SpawnDeathParticles(massBeforeCollision, collidedWith);
        }
      }

      [ClientRpc]
      void RpcSpawnDeathParticles(float massBeforeCollision, GameObject collidedWith)
      {
        SpawnDeathParticles(massBeforeCollision, collidedWith);
      }

      private void SpawnDeathParticles(float massBeforeCollision, GameObject collidedWith)
      {
        GameObject particles = GameObject.Instantiate(PrefabManager.prefabs["BlobDestroyedParticles"], transform.position, Quaternion.LookRotation(Vector3.forward, lastDirection));
        ParticleSystem particleSystem = particles.GetComponent<ParticleSystem>();
        ParticleSystem.MainModule mainModule = particleSystem.main;
        mainModule.startColor = this.circleRenderer.color;
        ParticleSystem.EmissionModule emissionModule = particleSystem.emission;
        emissionModule.SetBurst(0, new ParticleSystem.Burst(0f, (short)massBeforeCollision));
        ParticleSystem.ExternalForcesModule externalForcesModule = particleSystem.externalForces;
        externalForcesModule.AddInfluence(collidedWith.GetComponentInChildren<ParticleSystemForceField>());
        ParticleSystem.TriggerModule triggerModule = particleSystem.trigger;
        triggerModule.AddCollider(collidedWith.GetComponent<Collider2D>());

        CameraShake.AddShake(massBeforeCollision / MAX_MASS);
      }

      [Server]
      public void CollidedWithBlob(float mass, int sourceBlobTeam, bool primary = false)
      {
        if (mass <= 0)
        {
          Debug.LogError($"CollidedWithBlob got negative mass {mass}");
        }
        if (sourceBlobTeam == this.team)
        {
          // if we are the bigger blob (primary used to handle case where masses are equal)
          if (this.mass > mass || (this.mass == mass && primary))
          {
            this.SetMass(this.mass + mass);
          }
          else
          {
            // die since the other blob absorbs us
            this.SetMass(0);
          }
        }
        else
        {
          this.SetMass(this.mass - mass);
        }


      }

      private void OnTriggerEnter2D(Collider2D other)
      {
        if (isServer && this.mass > 0)
        {

          // mass < 0 means we have already handled our collisions
          Debug.Log($"Blob.OnTriggerEnter2D({other.gameObject.name}, {this.mass})");
          float massBeforeCollision = this.mass;
          int teamBeforeCollision = this.team;
          if (other.gameObject.layer == LayerMask.NameToLayer("Node"))
          {
            var node = other.gameObject.GetComponent<Node>();
            node.CollidedWithBlob(this.mass, this.team);
            this.SetMass(0);
            DieFromCollision(massBeforeCollision, node.gameObject);
          }
          else if (other.gameObject.layer == LayerMask.NameToLayer("Blob"))
          {
            var otherBlob = other.gameObject.GetComponent<Blob>();
            float otherBlobMassBeforeCollision = otherBlob.mass;
            if (otherBlobMassBeforeCollision <= 0)
            {
              // ignore collision, this blob should be destroyed soon
              return;
            }

            this.CollidedWithBlob(otherBlob.mass, otherBlob.team, true);
            otherBlob.CollidedWithBlob(massBeforeCollision, teamBeforeCollision, false);

            if (this.mass <= 0)
            {
              DieFromCollision(massBeforeCollision, otherBlob.gameObject);
            }
            if (otherBlob.mass <= 0)
            {
              otherBlob.DieFromCollision(otherBlobMassBeforeCollision, this.gameObject);
            }
          }
        }
      }
    }
  }
}
