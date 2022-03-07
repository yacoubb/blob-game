using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CameraShake : MonoBehaviour
{
  static float shakeAmount = 0f;
  static readonly Vector3 cameraStartPos = Vector3.back * 10f;

  public static void AddShake(float amount)
  {
    shakeAmount += amount;
  }

  // Update is called once per frame
  void Update()
  {
    CameraShake.shakeAmount = Mathf.Max(0, CameraShake.shakeAmount * 0.9f);
    Camera.main.transform.localPosition = cameraStartPos + (Vector3)Random.insideUnitCircle * CameraShake.shakeAmount;
  }
}
