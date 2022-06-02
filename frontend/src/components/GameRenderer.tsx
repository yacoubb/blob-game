/* eslint-disable no-bitwise */
/* eslint-disable no-param-reassign */
import { Edge, Map, Node, Blob } from '@lobby/gameserver/dist/types';
import { getBlobPos } from '@lobby/gameserver/dist/game';
import * as PIXI from 'pixi.js';

const colors: Record<number | string, number> = {
  edge: 0x555555,
  0: 0x999999,
  1: 0xff0000,
  2: 0x0000ff,
};

// would it make more sense to write this as a callable class rather than a react component?
// of course react says everything should be declarative
// but doing stuff like initiating a rerender requires modifying data

// types for a map scaled to a particular screen size
type ScaledDimensions = { sx: number; sy: number; sr: number };
type ScaledMapRecords = {
  nodes: Record<string, Node & ScaledDimensions>;
  edges: Record<string, Edge>;
  blobs: Record<string, Blob & ScaledDimensions>;
};

type ScaledMap = ScaledMapRecords & { edgeWidth: number };

type RenderedGraphic = {
  graphic: PIXI.Graphics;
  currentRadius: number;
  currentColor: number;
};
class GameRenderer {
  renderedGraphics: Record<string, RenderedGraphic> = {};

  static getScaledMap(map: Map, pixi: PIXI.Application): ScaledMap {
    const width = pixi.view.offsetWidth;
    const height = pixi.view.offsetHeight;
    const padding = 100;

    const computeX = (val: number) => padding + val * (width - 2 * padding);
    const computeY = (val: number) => padding + val * (height - 2 * padding);
    const computeR = (val: number) =>
      (val / 100) * Math.min(width, height) * 0.1;

    const scaledMapNodes: ScaledMap['nodes'] = {};
    for (const nodeID of Object.keys(map.nodes)) {
      const node = map.nodes[nodeID];
      scaledMapNodes[nodeID] = {
        ...node,
        sx: computeX(node.x),
        sy: computeY(node.y),
        sr: computeR(node.mass),
      };
    }

    const scaledMapBlobs: ScaledMap['blobs'] = {};
    for (const blobID of Object.keys(map.blobs)) {
      const blob = map.blobs[blobID];
      const { x, y } = getBlobPos(map, blobID);
      scaledMapBlobs[blobID] = {
        ...blob,
        sx: computeX(x),
        sy: computeY(y),
        sr: computeR(blob.mass),
      };
    }

    return {
      nodes: scaledMapNodes,
      edges: map.edges,
      blobs: scaledMapBlobs,
      edgeWidth: computeR(30),
    };
  }

  getRenderedGraphic(id: string, pixi: PIXI.Application): RenderedGraphic {
    let graphic: RenderedGraphic;
    if (id in this.renderedGraphics) {
      graphic = this.renderedGraphics[id];
    } else {
      graphic = {
        graphic: new PIXI.Graphics(),
        currentColor: 0,
        currentRadius: 0,
      };
      pixi.stage.addChild(graphic.graphic);
    }

    return graphic;
  }

  // https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  static dist2(v: ScaledDimensions, w: ScaledDimensions) {
    return (v.sx - w.sx) ** 2 + (v.sy - w.sy) ** 2;
  }

  static distToSegmentSquared(
    p: ScaledDimensions,
    v: ScaledDimensions,
    w: ScaledDimensions,
  ) {
    const l2 = GameRenderer.dist2(v, w);
    if (l2 === 0) return GameRenderer.dist2(p, v);
    let t =
      ((p.sx - v.sx) * (w.sx - v.sx) + (p.sy - v.sy) * (w.sy - v.sy)) / l2;
    t = Math.max(0, Math.min(1, t));
    return GameRenderer.dist2(p, {
      sx: v.sx + t * (w.sx - v.sx),
      sy: v.sy + t * (w.sy - v.sy),
      sr: 0,
    });
  }

  static lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  // https://gist.github.com/nikolas/b0cce2261f1382159b507dd492e1ceef
  static lerpColor(a: number, b: number, t: number) {
    const ar = a >> 16;
    const ag = (a >> 8) & 0xff;
    const ab = a & 0xff;

    const br = b >> 16;
    const bg = (b >> 8) & 0xff;
    const bb = b & 0xff;

    const rr = ar + t * (br - ar);
    const rg = ag + t * (bg - ag);
    const rb = ab + t * (bb - ab);

    return (rr << 16) + (rg << 8) + (rb | 0);
  }

  edgeClickCallback?: (edgeID: string, aToB: boolean) => void;

  render(
    unscaledMap: Map,
    pixi: PIXI.Application,
    edgeClickCallback?: (edgeID: string, aToB: boolean) => void,
  ) {
    console.log('GameRenderer.render()');
    if (edgeClickCallback) this.edgeClickCallback = edgeClickCallback;
    const nextRenderedGraphics: typeof this.renderedGraphics = {};

    const scaledMap = GameRenderer.getScaledMap(unscaledMap, pixi);

    for (const edgeID of Object.keys(scaledMap.edges)) {
      const edge = scaledMap.edges[edgeID];
      const nodeA = scaledMap.nodes[edge.nodeA];
      const nodeB = scaledMap.nodes[edge.nodeB];

      const renderedGraphic = this.getRenderedGraphic(edgeID, pixi);
      const { graphic } = renderedGraphic;
      graphic.clear();
      graphic.lineStyle({ color: colors.edge, width: scaledMap.edgeWidth });
      graphic.moveTo(nodeA.sx, nodeA.sy).lineTo(nodeB.sx, nodeB.sy);
      // setting up edge clicks
      graphic.interactive = true;
      graphic.hitArea = {
        contains: (x, y) =>
          GameRenderer.distToSegmentSquared(
            { sx: x, sy: y, sr: 0 },
            nodeA,
            nodeB,
          ) <
          (scaledMap.edgeWidth / 2) ** 2,
      };
      (graphic as any).click = (ev: PIXI.InteractionEvent) => {
        const { x, y } = ev.data.global;
        const aToB =
          GameRenderer.dist2({ sx: x, sy: y, sr: 0 }, nodeA) <
          GameRenderer.dist2({ sx: x, sy: y, sr: 0 }, nodeB);
        this.edgeClickCallback?.(edgeID, aToB);
      };

      nextRenderedGraphics[edgeID] = { ...renderedGraphic, graphic };
    }

    for (const blobLike of [
      ...Object.values(scaledMap.nodes),
      ...Object.values(scaledMap.blobs),
    ]) {
      const renderedGraphic = this.getRenderedGraphic(blobLike.id, pixi);
      const { graphic, currentColor, currentRadius } = renderedGraphic;
      const updatedColor = GameRenderer.lerpColor(
        currentColor,
        colors[blobLike.team],
        0.5,
      );
      const updatedRadius = GameRenderer.lerp(currentRadius, blobLike.sr, 0.5);
      graphic.clear();
      graphic.x = blobLike.sx;
      graphic.y = blobLike.sy;
      graphic.beginFill(updatedColor).drawCircle(0, 0, updatedRadius);

      nextRenderedGraphics[blobLike.id] = {
        graphic,
        currentColor: updatedColor,
        currentRadius: updatedRadius,
      };
    }

    for (const lastID of Object.keys(this.renderedGraphics)) {
      if (!(lastID in nextRenderedGraphics)) {
        this.renderedGraphics[lastID].graphic.clear();
        pixi.stage.removeChildAt(
          pixi.stage.children.indexOf(this.renderedGraphics[lastID].graphic),
        );
        delete this.renderedGraphics[lastID];
      }
    }

    this.renderedGraphics = nextRenderedGraphics;
  }
}

// interface GameRendererProps {
//   map: Map;
//   pixiApp: PIXI.Application;
// }
// const GameRenderer: React.FC<GameRendererProps> = ({ map, pixiApp }) => {
//   const [renderedObjects, setRenderedObjects] = React.useState<
//     Record<string, PIXI.Graphics>
//   >({});

//   const [resizeDrawTimer, setResizeDrawTimer] =
//     React.useState<ReturnType<typeof setTimeout>>();
//   React.useEffect(() => {
//     if (resizeDrawTimer) {
//       clearTimeout(resizeDrawTimer);
//     }
//     setResizeDrawTimer(
//       setTimeout(() => {
//         setResizeDrawTimer(undefined);
//       }),
//     );
//   });

//   React.useEffect(() => {
//     console.log('GameRenderer render loop');
//     const width = pixiApp.view.offsetWidth;
//     const height = pixiApp.view.offsetHeight;
//     const padding = 100;

//     const computeX = (val: number) => padding + val * (width - 2 * padding);
//     const computeY = (val: number) => padding + val * (height - 2 * padding);
//     const computeR = (val: number) =>
//       (val / 100) * Math.min(width, height) * 0.05;

//     const updateGraphicAsNode = (graphic: PIXI.Graphics, node: Node): PIXI.Graphics => {
//       graphic.clear();
//       graphic.beginFill(colors[node.team]);
//       graphic.x = computeX(node.x);
//       graphic.y = computeY(node.y);
//       graphic.drawCircle(0, 0, computeR(node.mass));
//       return graphic;
//     };
//     // called every time map changes
//     const newRenderedObjects: typeof renderedObjects = {};
//     for (const nodeID of Object.keys(map.nodes)) {
//       let graphic;
//       if (nodeID in renderedObjects) {
//         graphic = renderedObjects[nodeID];
//       } else {
//         graphic = new PIXI.Graphics();
//         pixiApp.stage.addChild(graphic);
//       }
//       const updated = updateGraphicAsNode(graphic, map.nodes[nodeID]);
//       newRenderedObjects[nodeID] = updated;
//     }
//     for (const oldNodeID of Object.keys(renderedObjects)) {
//       if (!(oldNodeID in newRenderedObjects)) {
//         renderedObjects[oldNodeID].clear();
//         pixiApp.stage.removeChildAt(
//           pixiApp.stage.children.indexOf(renderedObjects[oldNodeID]),
//         );
//       }
//     }
//   }, [
//     map,
//     pixiApp.stage,
//     pixiApp.view.offsetHeight,
//     pixiApp.view.offsetWidth,
//     renderedObjects,
//   ]);

//   return null;
// };

export default GameRenderer;
