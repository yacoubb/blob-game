using System.Collections;
using System.Collections.Generic;
using Mirror;
using TMPro;
using UnityEngine;

namespace BlobGame
{
  namespace Map
  {
    public abstract class BlobLike : Mirror.NetworkBehaviour
    {
      private void OnValidate()
      {
        if (GetComponentInChildren<SpriteRenderer>() == null)
        {
          Debug.LogError($"{this.gameObject.name} missing sprite renderer in children");
        }
        if (GetComponentInChildren<CircleCollider2D>() == null)
        {
          Debug.LogError($"{this.gameObject.name} missing circle collider in children");
        }
        if (GetComponentInChildren<Rigidbody2D>() == null)
        {
          Debug.LogError($"{this.gameObject.name} missing rigidbody 2d in children");
        }
      }

      [SyncVar]
      public int team;
      [SyncVar]
      public float mass;

      public const float MAX_MASS = 100;
      public float maxMass = MAX_MASS;

      private SpriteRenderer _circleRenderer;
      protected SpriteRenderer circleRenderer
      {
        get
        {
          if (_circleRenderer != null)
          {
            return _circleRenderer;
          }
          _circleRenderer = GetComponentInChildren<SpriteRenderer>();
          return _circleRenderer;
        }
      }

      private Rigidbody2D _rigidbody2D;
      new protected Rigidbody2D rigidbody2D
      {
        get
        {
          if (_rigidbody2D != null)
          {
            return _rigidbody2D;
          }
          _rigidbody2D = GetComponentInChildren<Rigidbody2D>();
          return _rigidbody2D;
        }
      }

      private CircleCollider2D _circleCollider;
      protected CircleCollider2D circleCollider
      {
        get
        {
          if (_circleCollider != null)
          {
            return _circleCollider;
          }
          _circleCollider = GetComponentInChildren<CircleCollider2D>();
          return _circleCollider;
        }
      }

      private TextMeshPro _textMesh;
      protected TextMeshPro textMesh
      {
        get
        {
          if (_textMesh != null)
          {
            return _textMesh;
          }
          _textMesh = GetComponentInChildren<TextMeshPro>();
          return _textMesh;
        }
      }

      protected virtual void Start()
      {
        Debug.Log($"BlobLike.Start()");
        if (!addedResizeListener)
        {
          CameraResizer.onCameraReiszed += SetNodeRadius;
          SetNodeRadius(CameraResizer.GetCameraBounds().Item1, CameraResizer.GetCameraBounds().Item2);
          addedResizeListener = true;
        }
      }
      // initialise diameter to 0 so blobs grow into existence rather than shrink
      float diameter = 0f;
      [SerializeField]
      static float nodeRadius = 1f;
      private static bool addedResizeListener = false;

      static void SetNodeRadius(Vector2 bottomLeft, Vector2 bounds)
      {
        nodeRadius = Mathf.Min(bounds.x, bounds.y) / 10f;
      }

      protected virtual void Update()
      {
        const float TRANSITION_SPEED = 0.2f;
        float targetDiameter = this.mass / MAX_MASS * nodeRadius;
        diameter = Mathf.Lerp(diameter, targetDiameter, TRANSITION_SPEED);
        this.circleRenderer.transform.localScale = Vector2.one * diameter;
        this.circleCollider.radius = diameter / 2;
        this.circleRenderer.color = Color.Lerp(this.circleRenderer.color, TeamColors.colors[this.team], TRANSITION_SPEED);
        this.textMesh.text = Mathf.Round(this.mass).ToString();
      }

      protected void SetMass(float newMass)
      {
        this.mass = Mathf.Min(maxMass, newMass);
      }
    }
  }
}
