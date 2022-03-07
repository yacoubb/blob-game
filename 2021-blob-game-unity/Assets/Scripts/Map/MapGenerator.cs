using System.Collections;
using System.Collections.Generic;
using System.Linq;
using DelaunatorSharp;
using Mirror;
using UnityEngine;

namespace BlobGame
{
  namespace Map
  {
    public static class Generator
    {
      class Point : DelaunatorSharp.IPoint
      {
        public double X { get; set; }
        public double Y { get; set; }

        public Point(double x, double y)
        {
          this.X = x;
          this.Y = y;
        }
      }

      public struct AbstractEdge
      {
        public readonly int p;
        public readonly int q;
        public readonly float w;

        public AbstractEdge(int p, int q, float w)
        {
          this.p = p;
          this.q = q;
          this.w = w;
        }

        public override bool Equals(object obj)
        {
          if (!(obj is AbstractEdge))
            return false;

          AbstractEdge b = (AbstractEdge)obj;
          return this.p == b.p && this.q == b.q;
        }

        public override int GetHashCode()
        {
          return this.p + this.q + this.w.GetHashCode();
        }

        public static bool operator ==(AbstractEdge a, AbstractEdge b)
        {
          return a.Equals(b);
        }

        public static bool operator !=(AbstractEdge a, AbstractEdge b)
        {
          return !a.Equals(b);
        }
      }

      public static void Generate(int playerCount)
      {
        Debug.Log($"Map.Generator.Generate({playerCount})");

        List<Node> nodes = new List<Node>();
        int i = 0;
        foreach (var (x, y) in new (int, int)[] { (0, 0), (0, 1), (1, 1), (1, 0) })
        {
          int mass = i < playerCount ? Node.PLAYER_START_MASS : Node.NEUTRAL_START_MASS;
          int team = i < playerCount ? i : Node.NEUTRAL_TEAM;
          var newNode = Node.CreateNode(x, y, mass, team);
          nodes.Add(newNode);
          i++;
        }
        for (i = 0; i < 8; i++)
        {
          const float BORDER_WIDTH = 0.1f;
          System.Func<Vector2> pointGenerator = () => new Vector2(BORDER_WIDTH + Random.value * (1 - 2 * BORDER_WIDTH), BORDER_WIDTH + Random.value * (1 - 2 * BORDER_WIDTH));
          Vector2 pos = BlobMath.PoissonDiscSample(nodes.Select(n => new Vector2(n.x, n.y)), pointGenerator);
          var newNode = Node.CreateNode(pos.x, pos.y, Node.NEUTRAL_START_MASS, Node.NEUTRAL_TEAM);
          nodes.Add(newNode);
        }

        // https://mapbox.github.io/delaunator/
        var delaunator = new DelaunatorSharp.Delaunator(nodes.Select(n => new Point(n.x, n.y)).ToArray<Point>());
        IEnumerable<(int, int)> sourceEdges = delaunator.Triangles.Select((_, index) => index)
                                                                  .Where(e => e > delaunator.Halfedges[e])
                                                                  .Select(e =>
                                                                    {
                                                                      int q = delaunator.Triangles[e];
                                                                      int p = delaunator.Triangles[DelaunatorSharp.Delaunator.NextHalfedge(e)];
                                                                      return (p, q);
                                                                    });

        // append weight (distance) to edge tuples
        var edges = sourceEdges.Select(e => new AbstractEdge(e.Item1, e.Item2, Vector2.Distance(nodes[e.Item1].pos, nodes[e.Item2].pos)));
        var mst = BlobMath.MST(edges);


        // don't let adjacent nodes in terms of order be connected
        edges = edges.Where((e) => Mathf.Abs(e.p - e.q) > 1);

        // remove the top 4 longest edges
        int edgesToRemove = 4;
        edges = edges.OrderByDescending(e => e.w);
        edges = edges.Where((_, index) => index >= edgesToRemove);

        // add back any missing MST edges
        edges = edges.Union(mst);

        // spawn edges over network
        edges.ToList().ForEach((edge) =>
        {
          Edge.CreateEdge(nodes[edge.p], nodes[edge.q]);
        });
      }

    }

    // had an idea for map generation
    // initially we were gonna use delauney triangulation to generate a pretty uniform map
    // what if instead we repeatedly try to add random, non-intersecting connections to the grid?
    // spawn nodes, try to connect random pairs of nodes, maybe add a heuristic for nodes closer together

  }
}
