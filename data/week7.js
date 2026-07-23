window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 7,
  title: "Graphs",
  goal: "DFS/BFS on grids and adjacency lists: connected components, cycle detection / topological sort, multi-source BFS.",
  patterns: ["Grid DFS/BFS", "Adjacency List", "Topological Sort", "Multi-source BFS"],
  questions: [
    {
      id: "number-of-islands",
      title: "Number of Islands",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/number-of-islands/",
      pattern: "Grid DFS",
      summary: "Given an m x n grid of '1' (land) and '0' (water), return the number of islands, where an island is a group of land cells connected horizontally or vertically.",
      hints: [
        "Think of each land cell as a node connected to its up/down/left/right land neighbors. How many separate groups are there?",
        "Scan every cell; when you hit an unvisited '1', run a DFS/BFS flood fill that marks the whole island as visited, and count one island per fill."
      ],
      explanation: `This is a connected-components count on an implicit graph: every land cell is a node, and edges exist between orthogonally adjacent land cells. Each island is exactly one connected component, so the answer is the number of times you have to start a fresh traversal to cover all land.

Iterate over every cell. When you find a '1' that has not been consumed yet, increment the island counter and flood-fill from that cell with DFS (or BFS), marking every reachable land cell so it is never counted again. A simple trick is to overwrite visited land with '0' ("sink" the island) so you do not need a separate visited structure.

The flood fill recurses into the four neighbors, returning immediately when it goes off the grid or lands on water. After the fill finishes, everything in that component is sunk, so the outer scan can only trigger a new fill on a genuinely new island. Every cell is visited a constant number of times, giving linear time in the grid size.`,
      pitfalls: [
        "Forgetting bounds checks before indexing neighbors (r/c off the grid)",
        "Not marking cells visited before/while exploring, causing infinite recursion",
        "Comparing against the number 1 instead of the character '1'",
        "Counting diagonal neighbors as connected (only 4-directional counts)"
      ],
      kotlin: `class Solution {
    fun numIslands(grid: Array<CharArray>): Int {
        var count = 0
        for (r in grid.indices) {
            for (c in grid[0].indices) {
                if (grid[r][c] == '1') {
                    count++
                    sink(grid, r, c)
                }
            }
        }
        return count
    }

    private fun sink(grid: Array<CharArray>, r: Int, c: Int) {
        if (r < 0 || r >= grid.size || c < 0 || c >= grid[0].size || grid[r][c] != '1') return
        grid[r][c] = '0'
        sink(grid, r + 1, c)
        sink(grid, r - 1, c)
        sink(grid, r, c + 1)
        sink(grid, r, c - 1)
    }
}`,
      complexity: "Time O(m·n) · Space O(m·n)"
    },
    {
      id: "clone-graph",
      title: "Clone Graph",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/clone-graph/",
      pattern: "Graph DFS + HashMap",
      summary: "Given a reference to a node in a connected undirected graph, return a deep copy of the entire graph, where each node has a value and a list of neighbors.",
      hints: [
        "The graph can contain cycles, so a naive copy-as-you-traverse will loop forever. What extra structure prevents copying the same node twice?",
        "Keep a hash map from original node to its clone; if a node is already in the map, return its existing clone instead of creating a new one."
      ],
      explanation: `A deep copy must create exactly one new node per original node and rewire all neighbor lists to point at clones, never at originals. Because the graph is undirected and can contain cycles, any traversal will revisit nodes, so you need a map from original node to its clone that doubles as the visited set.

Do a DFS from the given node. For each original node: if its clone already exists in the map, return that clone immediately (this is what breaks cycles). Otherwise create the clone, register it in the map before touching the neighbors, then recursively clone each neighbor and append the results to the clone's neighbor list.

Registering the clone in the map before recursing is the crucial step: in a cycle like A-B-A, cloning B will ask for A again, and A's half-built clone must already be findable or you recurse forever. BFS with the same map works equally well. Each node and edge is processed once, so the whole thing is linear in the graph size.`,
      pitfalls: [
        "Inserting the clone into the map after recursing on neighbors — cycles then cause infinite recursion",
        "Adding original neighbor nodes to the clone's list instead of cloned neighbors",
        "Not handling the null input (empty graph)",
        "Using node values as map keys works here only because values are unique — mapping node to node is the safe habit"
      ],
      kotlin: "class Solution {\n    private val cloned = HashMap<Node, Node>()\n\n    fun cloneGraph(node: Node?): Node? {\n        if (node == null) return null\n        cloned[node]?.let { return it }\n        val copy = Node(node.`val`)\n        // register before recursing so cycles find the clone\n        cloned[node] = copy\n        for (neighbor in node.neighbors) {\n            copy.neighbors.add(cloneGraph(neighbor))\n        }\n        return copy\n    }\n}",
      complexity: "Time O(V+E) · Space O(V)"
    },
    {
      id: "course-schedule",
      title: "Course Schedule",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/course-schedule/",
      pattern: "Topological Sort",
      summary: "Given numCourses and a list of [course, prerequisite] pairs, return true if it is possible to finish all courses, i.e. the prerequisite graph has no cycle.",
      hints: [
        "Model courses as nodes and prerequisites as directed edges. When exactly is it impossible to order the courses?",
        "It is impossible exactly when the directed graph has a cycle — detect it with Kahn's algorithm (repeatedly remove nodes with indegree 0) or DFS coloring."
      ],
      explanation: `Model each course as a node and draw a directed edge from a prerequisite to the course that needs it. Finishing all courses is possible if and only if this directed graph has no cycle, because a cycle means some course transitively requires itself. So the problem reduces to cycle detection, and the cleanest tool is Kahn's algorithm (BFS topological sort).

Build an adjacency list (prereq -> dependent courses) and an indegree array counting how many prerequisites each course still has. Seed a queue with every course whose indegree is 0 — those can be taken immediately. Repeatedly pop a course, count it as taken, and decrement the indegree of each dependent; whenever a dependent's indegree drops to 0, push it onto the queue.

When the queue empties, compare the number of courses taken with numCourses. If they are equal, a valid ordering exists; if fewer, the leftover courses all sit on a cycle (their indegrees never reached 0), so return false. The DFS alternative marks nodes white/gray/black and reports a cycle when it meets a gray node, but Kahn's is easier to get right under pressure.`,
      pitfalls: [
        "Reversing edge direction inconsistently — pick prereq -> course and stick with it everywhere",
        "Empty prerequisites list: every indegree is 0 and the answer is simply true",
        "Duplicate prerequisite pairs inflating indegree (harmless with this exact counting, but know why)",
        "In DFS cycle detection, using a single visited flag instead of the in-current-path (gray) state"
      ],
      kotlin: `class Solution {
    fun canFinish(numCourses: Int, prerequisites: Array<IntArray>): Boolean {
        val graph = Array(numCourses) { mutableListOf<Int>() }
        val indegree = IntArray(numCourses)
        for (pair in prerequisites) {
            graph[pair[1]].add(pair[0])
            indegree[pair[0]]++
        }
        val queue = ArrayDeque<Int>()
        for (course in 0 until numCourses) {
            if (indegree[course] == 0) queue.add(course)
        }
        var taken = 0
        while (queue.isNotEmpty()) {
            val course = queue.removeFirst()
            taken++
            for (next in graph[course]) {
                indegree[next]--
                if (indegree[next] == 0) queue.add(next)
            }
        }
        return taken == numCourses
    }
}`,
      complexity: "Time O(V+E) · Space O(V+E)"
    },
    {
      id: "pacific-atlantic-water-flow",
      title: "Pacific Atlantic Water Flow",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/pacific-atlantic-water-flow/",
      pattern: "Grid DFS from borders",
      summary: "Given an m x n height grid where water flows to equal-or-lower neighbors, return all cells from which water can reach both the Pacific (top/left edges) and Atlantic (bottom/right edges) oceans.",
      hints: [
        "Checking every cell with its own search is expensive. Could you instead start the search from where the water ends up?",
        "Reverse the flow: DFS/BFS inward from each ocean's border cells, moving only to neighbors with height >= current, and intersect the two reachable sets."
      ],
      explanation: `The naive approach runs a search from every cell to see if it reaches both oceans — that is O((mn)^2). The key insight is to reverse the direction of flow: instead of asking "which oceans can this cell reach?", ask "which cells can this ocean reach?" walking uphill. Water flows from high to equal-or-lower, so climbing from the ocean means moving to neighbors whose height is >= the current cell.

Run one flood fill for each ocean. The Pacific fill starts simultaneously from every cell on the top row and left column; the Atlantic fill from every cell on the bottom row and right column. Each fill marks a boolean grid of cells that ocean can be reached from, using DFS (or BFS) that only steps to in-bounds, unvisited neighbors with height >= the current height.

Finally scan the grid once and collect every cell marked reachable in both boolean grids — those are the cells whose water can flow to both oceans. Two fills plus one scan touch each cell a constant number of times, so the total is O(m·n).`,
      pitfalls: [
        "Getting the comparison backwards: traversal goes uphill, so the neighbor needs height >= current, not <=",
        "Sharing one visited grid between the two oceans instead of keeping separate pacific/atlantic grids",
        "Forgetting the corner rows/columns seed both fills correctly (top/left = Pacific, bottom/right = Atlantic)",
        "Re-visiting already marked cells, blowing up the recursion"
      ],
      kotlin: `class Solution {
    fun pacificAtlantic(heights: Array<IntArray>): List<List<Int>> {
        val rows = heights.size
        val cols = heights[0].size
        val pacific = Array(rows) { BooleanArray(cols) }
        val atlantic = Array(rows) { BooleanArray(cols) }
        for (r in 0 until rows) {
            dfs(heights, pacific, r, 0)
            dfs(heights, atlantic, r, cols - 1)
        }
        for (c in 0 until cols) {
            dfs(heights, pacific, 0, c)
            dfs(heights, atlantic, rows - 1, c)
        }
        val result = mutableListOf<List<Int>>()
        for (r in 0 until rows) {
            for (c in 0 until cols) {
                if (pacific[r][c] && atlantic[r][c]) result.add(listOf(r, c))
            }
        }
        return result
    }

    private fun dfs(heights: Array<IntArray>, reachable: Array<BooleanArray>, r: Int, c: Int) {
        reachable[r][c] = true
        val dirs = intArrayOf(-1, 0, 1, 0, -1)
        for (i in 0 until 4) {
            val nr = r + dirs[i]
            val nc = c + dirs[i + 1]
            if (nr in heights.indices && nc in heights[0].indices &&
                !reachable[nr][nc] && heights[nr][nc] >= heights[r][c]
            ) {
                dfs(heights, reachable, nr, nc)
            }
        }
    }
}`,
      complexity: "Time O(m·n) · Space O(m·n)"
    },
    {
      id: "rotting-oranges",
      title: "Rotting Oranges",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/rotting-oranges/",
      pattern: "Multi-source BFS",
      summary: "Given a grid of empty cells (0), fresh oranges (1), and rotten oranges (2) where rot spreads to adjacent fresh oranges each minute, return the minutes until no fresh orange remains, or -1 if impossible.",
      hints: [
        "Rot spreads outward one step per minute from every rotten orange at the same time — which traversal naturally models simultaneous, layer-by-layer spread?",
        "Start a BFS with all initially rotten oranges in the queue at once (multi-source), and treat each BFS level as one minute."
      ],
      explanation: `Rot spreads simultaneously from all rotten oranges, one grid step per minute — that is exactly BFS expanding in layers, except with multiple starting points. Multi-source BFS handles this by seeding the queue with every rotten orange before starting, so the whole first layer of infection happens in one round.

Scan the grid once: push the coordinates of every rotten orange onto the queue and count the fresh oranges. If there are no fresh oranges, the answer is 0 immediately. Then run BFS level by level: for each minute, process exactly the cells currently in the queue (snapshot the queue size), and for each one, infect its 4-directional fresh neighbors — mark them rotten in the grid, decrement the fresh counter, and enqueue them. Increment the minute counter once per level.

Stop when the queue is empty or no fresh oranges remain. If the fresh counter reached 0, return the minutes elapsed; otherwise some fresh orange was unreachable (walled off by empty cells) and the answer is -1. Each cell enters the queue at most once, so the run is O(m·n).`,
      pitfalls: [
        "Running a separate BFS per rotten orange instead of seeding them all at once",
        "Off-by-one minutes: incrementing the timer after a level that infected nothing (loop while fresh > 0, or track the last level that did work)",
        "Grid with zero fresh oranges must return 0, not -1",
        "Not marking an orange rotten at enqueue time, letting it be enqueued twice from two neighbors"
      ],
      kotlin: `class Solution {
    fun orangesRotting(grid: Array<IntArray>): Int {
        val queue = ArrayDeque<IntArray>()
        var fresh = 0
        for (r in grid.indices) {
            for (c in grid[0].indices) {
                when (grid[r][c]) {
                    1 -> fresh++
                    2 -> queue.add(intArrayOf(r, c))
                }
            }
        }
        if (fresh == 0) return 0
        var minutes = 0
        val dirs = intArrayOf(-1, 0, 1, 0, -1)
        while (queue.isNotEmpty() && fresh > 0) {
            repeat(queue.size) {
                val cell = queue.removeFirst()
                for (i in 0 until 4) {
                    val nr = cell[0] + dirs[i]
                    val nc = cell[1] + dirs[i + 1]
                    if (nr in grid.indices && nc in grid[0].indices && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2
                        fresh--
                        queue.add(intArrayOf(nr, nc))
                    }
                }
            }
            minutes++
        }
        return if (fresh == 0) minutes else -1
    }
}`,
      complexity: "Time O(m·n) · Space O(m·n)"
    }
  ]
});
