using System.Collections.Generic;
using UnityEngine;

namespace BlobGame
{
  public static class TeamColors
  {
    public static Dictionary<int, Color> colors = new Dictionary<int, Color>() {
      {-1, Color.white},
      {0, Color.red},
      {1, Color.blue}
    };
  }
}