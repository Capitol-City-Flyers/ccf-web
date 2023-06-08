import _ from "lodash";
import {freeze} from "immer";

/**
 * {@link WeightedItemGraph} is a weighted graph which associates some arbitrary `item` with each edge, allowing a
 * minimum cost path "through" those items to be calculated.
 *
 * Adapted from [Prottoy2938/Dijkstra's-algorithm.js](https://gist.github.com/Prottoy2938/66849e04b0bac459606059f5f9f3aa1a)
 */
export class WeightedItemGraph<TVertex, TItem> {
    private adjacencyList = new Map<TVertex, Array<{
        vertex: TVertex;
        item: TItem;
        weight: number;
    }>>();

    private constructor(private readonly edges: Array<WeightedEdge<TVertex, TItem>>) {
        _.uniq(_.flatten(_.map(edges, "vertices"))).forEach(vertex => this.addVertex(vertex));
        edges.forEach(edge => this.addEdge(edge.vertices[0], edge.vertices[1], edge.item, null != edge.weight ? edge.weight : 1));
    }

    span(from: TVertex, to: TVertex) {
        const {adjacencyList} = this,
            nodes = new PriorityQueue<TVertex>(),
            distances = new Map<TVertex, number>(),
            previous = new Map<TVertex, TVertex>();
        for (let vertex of adjacencyList.keys()) {
            if (vertex === from) {
                distances.set(vertex, 0);
                nodes.enqueue(vertex, 0);
            } else {
                distances.set(vertex, Infinity);
                nodes.enqueue(vertex, Infinity);
            }
            previous.delete(vertex);
        }
        let smallest: TVertex;
        const path = new Array<TVertex>();
        while (!nodes.isEmpty()) {
            smallest = nodes.dequeue();
            if (smallest === to) {
                while (previous.has(smallest)) {
                    path.push(smallest);
                    smallest = previous.get(smallest);
                }
                break;
            }
            if (smallest || Infinity !== distances.get(smallest)) {
                for (const neighborIdx in adjacencyList.get(smallest)) {
                    const nextNode = adjacencyList.get(smallest)[neighborIdx],
                        candidate = distances.get(smallest) + nextNode.weight,
                        nextNeighbor = nextNode.vertex;
                    if (candidate < distances.get(nextNeighbor)) {
                        distances.set(nextNeighbor, candidate);
                        previous.set(nextNeighbor, smallest);
                        nodes.enqueue(nextNeighbor, candidate);
                    }
                }
            }
        }
        if (0 === path.length) {
            throw Error("No path found.");
        }

        /* Convert vertex path to edge items. */
        const {edges} = this,
            vertices = path.concat(smallest).reverse(),
            items = new Array<TItem>();
        for (let i = 1; i < vertices.length; i += 1) {
            const edge = edges.find(({vertices: [from, to]}) => vertices[i - 1] === from && vertices[i] === to);
            items.push(edge.item);
        }
        return items;
    }

    private addEdge(vertex1: TVertex, vertex2: TVertex, item: TItem, weight: number) {
        const {adjacencyList} = this;
        adjacencyList.get(vertex1).push({
            vertex: vertex2,
            item, weight
        });
        adjacencyList.get(vertex2).push({
            vertex: vertex1,
            item, weight
        });
        return this;
    }

    private addVertex(vertex: TVertex) {
        const {adjacencyList} = this;
        if (!adjacencyList.has(vertex)) {
            adjacencyList.set(vertex, []);
        }
        return this;
    }

    /**
     * Create a {@link WeightedItemGraph} from a list of edges.
     *
     * Note that the edges are cloned to ensure that the structure of the graph does not change after creation. The
     * returned object is immutable and reusable.
     *
     * @param edges the edges.
     */
    static create<TVertex, TItem>(...edges: Array<WeightedEdge<TVertex, TItem> | Array<WeightedEdge<TVertex, TItem>>>) {
        const allEdges = _.flatten(_.map(edges, edges => _.isArray(edges) ? edges : [edges]))
            .map(edge => freeze(_.clone(edge)));
        return freeze(new WeightedItemGraph<TVertex, TItem>(allEdges));
    }
}

/**
 * {@link PriorityQueue} is the priority queue implementation used to implement the Dijkstra minimal path algorithm in
 * {@link WeightedItemGraph.span}.
 */
class PriorityQueue<TValue> {
    private values = new Array<{
        readonly value: TValue;
        readonly priority: number;
    }>();

    enqueue(value: TValue, priority: number) {
        this.values.push({value, priority});
        this.bubbleUp();
    }

    dequeue() {
        const {values} = this,
            min = values[0],
            end = values.pop();
        if (values.length > 0) {
            values[0] = end;
            this.sinkDown();
        }
        return min.value;
    }

    isEmpty() {
        return 0 === this.values.length;
    }

    private bubbleUp() {
        const {values} = this;
        let idx = values.length - 1;
        const last = values[idx];
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2),
                parent = values[parentIdx];
            if (last.priority >= parent.priority) {
                break;
            }
            values[parentIdx] = last;
            values[idx] = parent;
            idx = parentIdx;
        }
    }

    private sinkDown() {
        const {values} = this;
        let idx = 0;
        const {length} = values,
            first = values[0];
        while (true) {
            let leftChildIdx = 2 * idx + 1,
                rightChildIdx = 2 * idx + 2,
                leftChild: PriorityQueue<TValue>["values"][number],
                rightChild: PriorityQueue<TValue>["values"][number],
                swapIdx: number;
            if (leftChildIdx < length) {
                leftChild = values[leftChildIdx];
                if (leftChild.priority < first.priority) {
                    swapIdx = leftChildIdx;
                }
            }
            if (rightChildIdx < length) {
                rightChild = values[rightChildIdx];
                if ((null == swapIdx && rightChild.priority < first.priority)
                    || (null != swapIdx && rightChild.priority < leftChild.priority)) {
                    swapIdx = rightChildIdx;
                }
            }
            if (null == swapIdx) {
                break;
            }
            values[idx] = values[swapIdx];
            values[swapIdx] = first;
            idx = swapIdx;
        }
    }
}

/**
 * An edge in a {@link WeightedItemGraph}.
 */
interface WeightedEdge<TVertex, TItem> {
    vertices: [from: TVertex, to: TVertex];
    item: TItem;
    weight?: number;
}
