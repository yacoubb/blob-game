using System.Collections.Generic;
using UnityEngine;

namespace BlobGame
{
  public static class PrefabManager
  {
    private static Dictionary<string, GameObject> _prefabs;
    public static Dictionary<string, GameObject> prefabs
    {
      get
      {
        if (_prefabs != null)
        {
          return _prefabs;
        }
        _prefabs = new Dictionary<string, GameObject>();
        foreach (var prefab in Resources.LoadAll<GameObject>("Prefabs"))
        {
          _prefabs[prefab.name] = prefab;
        }
        return _prefabs;
      }
    }
  }
}