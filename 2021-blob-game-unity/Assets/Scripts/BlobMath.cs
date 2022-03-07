using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace BlobGame
{
  public static class BlobMath
  {
    public static float randomNormal(float mean = 0, float var = 1)
    {
      float z = Mathf.Cos(2 * Mathf.PI * Random.value) * Mathf.Sqrt(-2 * Mathf.Log(Random.value));
      return mean + z * var;
    }

    // Mitchell's best candidate
    public static Vector2 PoissonDiscSample(IEnumerable<Vector2> points, System.Func<Vector2> pointGenerator, int n = 30)
    {
      Vector2 bestCandidate = Vector2.zero;
      float bestDistance = 0;
      for (int i = 0; i < n; i++)
      {
        Vector2 candidate = pointGenerator();
        // Vector2 candidate = Random.insideUnitCircle;
        float dist = points.Select(p => Vector2.Distance(p, candidate)).Min();
        if (dist > bestDistance)
        {
          bestCandidate = candidate;
          bestDistance = dist;
        }
      }
      return bestCandidate;
    }

    // Prim's
    // returns an array containing the edges that comprise the MST
    public static BlobGame.Map.Generator.AbstractEdge[] MST(IEnumerable<BlobGame.Map.Generator.AbstractEdge> edges)
    {
      // start with node at index 0, keep adding the lowest weight edge until candidateEdges is empty
      List<BlobGame.Map.Generator.AbstractEdge> mst = new List<Map.Generator.AbstractEdge>();

      HashSet<int> closed = new HashSet<int>();
      IEnumerable<BlobGame.Map.Generator.AbstractEdge> candidateEdges = new List<Map.Generator.AbstractEdge>(edges);
      int attempts = 0;
      while (candidateEdges.Count() > 0)
      {
        var minEdge = candidateEdges.OrderBy(e => e.w).ElementAt(0);
        mst.Add(minEdge);
        closed.Add(minEdge.p);
        closed.Add(minEdge.q);
        // candidate edges becomes all edges with one node in closed and one node not in closed
        candidateEdges = candidateEdges.Where(e => closed.Contains(e.p) ^ closed.Contains(e.q));

        attempts++;
        if (attempts > 1000)
        {
          Debug.LogError("MST attempts exceeded");
          break;
        }
      }

      return mst.ToArray();



      // weight matrix
      // indexed by a node index, contains a list of connected node indices and the weight of the connecting edges
      // Dictionary<int, List<(int, float)>> weightMatrix = new Dictionary<int, List<(int, float)>>();
      // foreach (var edge in edges)
      // {
      //   if (!weightMatrix.ContainsKey(edge.Item1))
      //   {
      //     weightMatrix[edge.Item1] = new List<(int, float)>();
      //   }
      //   weightMatrix[edge.Item1].Add((edge.Item2, Vector2.Distance(points[edge.Item1], points[edge.Item2])));
      // }
      // List<int> closed = new List<int>(); // nodes in the tree
      // List<(int, int)> mst = new List<(int, int)>();
      // closed.Add(0); // arbitrarily start with 0th node
      // while (closed.Count != points.Length)
      // {
      //   // find the lowest weight edge starting from a node in closed going to a node not in closed

      //   // these are the edges that we could add to the tree
      //   IEnumerable<(int, float)> candidateEdges = closed.Select(nodeIndex => weightMatrix[nodeIndex])
      //                                             .Aggregate(new List<(int, float)>(),
      //                                               (total, current) => total.Concat(current).ToList()
      //                                             )
      //                                             .Where(edge => !closed.Contains(edge.Item1));
      //   // grab the lowest weight edge and add it!

      // }
    }
  }
}