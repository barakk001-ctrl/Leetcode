window.LC_LEARN = window.LC_LEARN || {};
window.LC_LEARN[7] = {
  sections: [
    {
      title: "Representing Graphs",
      body: `Interviews almost never hand you a Graph class. You get an edge list, a number of nodes, or a 2D grid — and the first step is always the same: build (or mentally overlay) an adjacency list, a map from each node to the list of its neighbors. Adjacency lists are the default because they store exactly the edges that exist: O(V + E) space, and iterating a node's neighbors costs only as much as the node's degree. An adjacency matrix (a V x V boolean table) answers "is there an edge u-v?" in O(1), but costs O(V^2) space and O(V) to scan neighbors — only worth it for small or dense graphs, which is rare in interviews.

The third representation is the sneaky one: a 2D grid IS a graph. Each cell is a node, and its neighbors are the 4 adjacent cells (up, down, left, right). You never materialize an adjacency list for a grid — you compute neighbors on the fly with a direction-vectors array and a bounds check. A huge fraction of "graph" interview problems (islands, mazes, flood fill, rotting oranges) are grids in disguise.

Recognition: if the input mentions edges, pairs, prerequisites, or connections — build an adjacency list. If the input is a matrix of cells and the question is about regions, spreading, or reaching cells — it is a grid graph, use the dirs trick.`,
      kotlin: `// Edge list -> adjacency list (add both directions if undirected)
fun buildAdj(n: Int, edges: Array<IntArray>): Array<MutableList<Int>> {
    val adj = Array(n) { mutableListOf<Int>() }
    for ((u, v) in edges) {
        adj[u].add(v)
        adj[v].add(u) // drop this line for a directed graph
    }
    return adj
}

// Grid neighbors: the dirs array trick
val dirs = arrayOf(intArrayOf(-1, 0), intArrayOf(1, 0), intArrayOf(0, -1), intArrayOf(0, 1))
for (d in dirs) {
    val nr = r + d[0]; val nc = c + d[1]
    if (nr in grid.indices && nc in grid[0].indices) { /* visit (nr, nc) */ }
}`
    },
    {
      title: "DFS: Go Deep, Backtrack",
      body: `Depth-first search picks a neighbor, goes as deep as it can, and only backtracks when it runs out of unvisited neighbors. Implement it either with recursion (cleanest — the call stack does the bookkeeping for you) or with an explicit stack when the graph might be deep enough to blow the JVM's call stack (grids up to ~10^6 cells can). Each node is entered once and each edge examined once, which is where O(V + E) comes from — but only if you mark nodes visited, otherwise you loop forever on any cycle.

DFS's core interview use is connected components: loop over every node (or cell), and each time you find one not yet visited, that is a NEW component — increment a counter and DFS from it to swallow the whole region. That is exactly Number of Islands: scan the grid, and every '1' you haven't seen starts a flood fill that turns the entire island into visited cells.

For marking visited on grids you have two options: mutate the grid in place (flip '1' to '0' or '#') — zero extra memory, idiomatic for interviews, but destroys the input; or keep a separate visited set / boolean array when the input must stay intact or when nodes aren't grid cells. Say the trade-off out loud in the interview; either is accepted.`,
      kotlin: `fun numIslands(grid: Array<CharArray>): Int {
    fun dfs(r: Int, c: Int) {
        if (r !in grid.indices || c !in grid[0].indices || grid[r][c] != '1') return
        grid[r][c] = '0' // mark visited by mutating
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
    }
    var count = 0
    for (r in grid.indices) for (c in grid[0].indices)
        if (grid[r][c] == '1') { count++; dfs(r, c) }
    return count
}`
    },
    {
      title: "BFS: Distance Rings and Shortest Paths",
      body: `Breadth-first search explores in rings: first everything 1 step from the start, then everything 2 steps away, and so on, using a FIFO queue. Because the queue processes all distance-k nodes before any distance-(k+1) node, the FIRST time BFS reaches a node is via a shortest path — in an unweighted graph. That is the single most important fact in this week: "minimum number of steps/moves" in an unweighted graph or grid means BFS, full stop. DFS finds A path; BFS finds the SHORTEST path.

Track distance either by storing (node, dist) pairs in the queue, or by processing the queue level-by-level: snapshot the queue size, drain exactly that many nodes, then increment the distance. The level-by-level form is what generalizes to multi-source BFS: seed the queue with ALL sources before starting (Rotting Oranges — every rotten orange is a source, and BFS naturally simulates rot spreading one minute per ring). Multi-source costs nothing extra; it is the same algorithm with more initial queue entries.

One rule that prevents the classic BFS bug: mark a node visited when you ENQUEUE it, not when you dequeue it. Otherwise the same node enters the queue many times and blows up your runtime.`,
      kotlin: `fun bfs(adj: Array<MutableList<Int>>, sources: List<Int>): IntArray {
    val dist = IntArray(adj.size) { -1 }
    val queue = ArrayDeque<Int>()
    for (s in sources) { dist[s] = 0; queue.add(s) } // multi-source: seed ALL
    while (queue.isNotEmpty()) {
        val u = queue.removeFirst()
        for (v in adj[u]) {
            if (dist[v] == -1) {        // visited check at ENQUEUE time
                dist[v] = dist[u] + 1
                queue.add(v)
            }
        }
    }
    return dist
}`
    },
    {
      title: "Cycle Detection and Topological Sort",
      body: `Any "prerequisites" or "build order" problem (Course Schedule, task scheduling, package dependencies) is a directed graph where an edge u -> v means "u must come before v". A valid ordering exists exactly when the graph is a DAG — no cycles. Topological sort produces that ordering, and failing to produce it detects the cycle; the two problems are one problem.

Kahn's algorithm is the BFS-flavored version and the one to reach for first. Compute each node's in-degree (number of incoming edges). Start a queue with every node of in-degree 0 — things with no prerequisites. Repeatedly dequeue a node, append it to the order, and decrement the in-degree of each neighbor; when a neighbor hits 0, enqueue it. The killer property: if the count of processed nodes is less than the total node count when the queue empties, the leftover nodes all sit on a cycle — no valid order exists. That one comparison IS your cycle detector.

The alternative in one sentence: three-color DFS marks nodes white (unvisited), gray (in the current recursion stack), black (done) — and finding an edge into a gray node means you have found a cycle.`,
      kotlin: `fun topoSort(n: Int, adj: Array<MutableList<Int>>): List<Int>? {
    val inDeg = IntArray(n)
    for (u in 0 until n) for (v in adj[u]) inDeg[v]++
    val queue = ArrayDeque<Int>()
    for (u in 0 until n) if (inDeg[u] == 0) queue.add(u)
    val order = mutableListOf<Int>()
    while (queue.isNotEmpty()) {
        val u = queue.removeFirst()
        order.add(u)
        for (v in adj[u]) if (--inDeg[v] == 0) queue.add(v)
    }
    return if (order.size == n) order else null // null => cycle
}`
    },
    {
      title: "Complexity and Recognition Cheat Sheet",
      body: `DFS, BFS, and Kahn's algorithm are all O(V + E) time: every vertex is visited once, and every edge is examined once (or twice for undirected — same big-O). Every visited set, visited boolean array, and grid mutation you have seen this week exists for exactly one reason: to guarantee that "once". Remove it and a single cycle turns your traversal into an infinite loop, and even without cycles nodes get reprocessed exponentially. Space is O(V) for the visited structure plus the stack or queue; grid problems are O(rows * cols) time and space.

Recognition cheat sheet — map the phrasing to the tool: "count islands / regions / provinces / connected groups" means grid or graph DFS/BFS for connected components. "Shortest path / minimum steps / fewest moves" in an UNWEIGHTED graph or grid means BFS (weighted edges push you to Dijkstra — usually beyond this week). "Prerequisites / dependencies / build order / can you finish" means topological sort with Kahn's, where leftover nodes reveal the cycle. "Spreads simultaneously from multiple points / minutes until all infected" means multi-source BFS with the queue seeded by every source.

When a problem does not mention graphs at all, ask: are there states, and can I move between them? Word ladders, locks with wheels, and knight moves are all graphs where nodes are states and edges are legal moves — recognize that, and the same four templates solve them.`
    }
  ]
};
