window.LC_LEARN = window.LC_LEARN || {};
window.LC_LEARN[6] = {
  sections: [
    {
      title: "Heaps: An Array Pretending to Be a Tree",
      body: `A binary heap is a complete binary tree stored flat in an array — no node objects, no pointers. For the element at index i, the children live at 2*i + 1 and 2*i + 2, and the parent at (i - 1) / 2 (integer division). "Complete" means every level is full except possibly the last, which fills left to right — that is exactly what makes the array layout gap-free. The heap property is local: in a min-heap every parent is <= its children. Note what it does NOT promise — the array is not sorted, and siblings have no ordering. The only global guarantee is that the minimum sits at index 0.

Operations are just repairs of that local property. Insert appends at the end and "sifts up": swap with the parent while smaller than it. Poll removes index 0, moves the last element to the root, and "sifts down": swap with the smaller child while larger than it. Both walk one root-to-leaf path, and a complete tree of n nodes has height log2(n), so insert and poll are O(log n). Peek just reads index 0 — O(1). Building a heap from n existing elements is O(n), not O(n log n): heapify sifts down from the last internal node backwards, and since half the nodes are leaves (sift distance 0), a quarter have distance 1, and so on, the distances sum to O(n).

In Java and Kotlin this is java.util.PriorityQueue, and it is a MIN-heap by default — poll() returns the smallest. This bites people in interviews constantly. For a max-heap pass a reversed comparator. Also remember: iterating a PriorityQueue does NOT visit elements in sorted order (it walks the raw array), and contains/remove(element) are O(n).`,
      kotlin: `import java.util.PriorityQueue

val minHeap = PriorityQueue<Int>()               // smallest on top
val maxHeap = PriorityQueue<Int>(compareByDescending { it })

minHeap.add(5); minHeap.add(1); minHeap.add(3)   // O(log n) each
minHeap.peek()                                    // 1, O(1)
minHeap.poll()                                    // 1 removed, O(log n)

// heap of pairs ordered by a field
val byDist = PriorityQueue<Pair<Int, Int>>(compareBy { it.first })`
    },
    {
      title: "Top-K: A Small Heap of the Opposite Kind",
      body: `To find the k LARGEST elements, keep a MIN-heap of size k. That inversion feels backwards until you see the invariant: the heap holds the k best candidates seen so far, and its root is the WEAKEST of them — the gatekeeper. For each new element, compare it to the root. If it beats the root, the root is provably not in the final top k, so poll it and add the newcomer. If it does not, discard the newcomer in O(1). Symmetrically, k smallest uses a max-heap. If you kept a max-heap for k largest instead, the strongest element would sit on top and the one you need to evict would be buried at a leaf — unreachable cheaply.

The payoff is complexity: n elements, each doing at most one O(log k) heap operation, gives O(n log k) time and O(k) space — versus O(n log n) for a full sort. When k is small and n is huge (top 10 of a billion, or a stream you cannot hold in memory), that is the whole ballgame. This also covers "k most frequent": build a count map, then run the same size-k heap over the map entries keyed by count. And "k closest points": min-... no — k closest means k SMALLEST distances, so the gatekeeper heap is a MAX-heap by distance. Always ask: what do I evict? The worst of my current candidates. Order the heap so that element is on top.`,
      kotlin: `// k largest values from an array: min-heap of size k
fun kLargest(nums: IntArray, k: Int): List<Int> {
    val heap = PriorityQueue<Int>()          // min-heap = gatekeeper
    for (x in nums) {
        heap.add(x)                          // O(log k)
        if (heap.size > k) heap.poll()       // evict weakest
    }
    return heap.toList()                     // any order; sort if needed
}
// k smallest / k closest: flip to compareByDescending on the key`
    },
    {
      title: "When NOT to Reach for a Heap",
      body: `A heap earns its keep only when you need PARTIAL order — the best few, or the current best while data keeps arriving. If you are going to consume all n elements in sorted order anyway, just sort: it is the same O(n log n), the constant factors are better (Arrays.sort on primitives is very fast), and the code is one line. Popping n elements one by one out of a heap IS heapsort, only slower and wordier.

If you need the kth element exactly once, quickselect beats both: partition around a pivot like quicksort, but recurse into only the side containing index k. Expected O(n) time, O(1) extra space, though worst case is O(n^2) on adversarial pivots (randomize to make that vanishingly unlikely). The decision table: one-shot kth element on data you can mutate — quickselect, O(n) average. Top k of a stream, or n too big for memory — heap, O(n log k). Need full sorted output, or k is close to n — sort. In an interview, saying this trade-off out loud before coding is worth as much as the code.`
    },
    {
      title: "Intervals: Sort First, Then Sweep",
      body: `Raw interval lists are chaos; sorting imposes an order that turns pairwise-overlap questions into a single linear sweep. Rule one: sort by START when MERGING. After that sort, an interval can only overlap the merged block you are currently building — curr.start <= prev.end means overlap (extend prev.end to max of the two ends); otherwise close the block and start a new one. Watch the touching-endpoints convention: [1,3] and [3,5] — is <= a merge or is < required? Problems differ; meetings usually treat back-to-back as fine, merging usually joins them. Say your assumption out loud.

Rule two: sort by END for GREEDY SCHEDULING — picking a maximum set of non-overlapping intervals ("minimum removals to avoid overlap" is the same problem: remove n minus that maximum). Always take the interval that ends earliest among the compatible ones. Why is that optimal? An exchange argument: take any optimal solution and look at its first interval — the earliest-ending interval finishes no later, so swapping it in cannot block anything the original allowed. Repeat down the line and greedy matches optimal. Intuition: finishing early leaves maximum room for the future. Sorting by start greedily is WRONG here — a long early-starting interval can smother many short ones.

Overall cost is O(n log n) for the sort plus O(n) for the sweep. Related shapes: "can attend all meetings" is sort by start and check that no interval starts before the previous ends; "minimum meeting rooms" is a heap of end times over start-sorted intervals — heaps and intervals meet in the middle.`,
      kotlin: `fun merge(intervals: Array<IntArray>): List<IntArray> {
    val sorted = intervals.sortedBy { it[0] }        // by START
    val out = mutableListOf<IntArray>()
    for (iv in sorted) {
        if (out.isNotEmpty() && iv[0] <= out.last()[1]) {
            // overlap (touching counts): extend current block
            out.last()[1] = maxOf(out.last()[1], iv[1])
        } else {
            out.add(intArrayOf(iv[0], iv[1]))        // new block
        }
    }
    return out
}`
    },
    {
      title: "Recognition Cheat-Sheet",
      body: `Heap triggers: the words "k largest", "k smallest", "k closest", "k most frequent", "kth ..." — especially over a stream or a dataset too big to sort. Also "median of a data stream" (two heaps, halves balanced) and "merge k sorted lists" (heap of k current heads, O(total log k)). The tell is that you care about a running best-few, not full order. Choose heap direction by asking what gets evicted: k largest evicts the smallest candidate, so min-heap; k smallest or k closest evicts the largest, so max-heap.

Interval triggers: input is pairs of [start, end] and the question mentions "merge", "insert", "overlap", "conflicts", "meetings", "rooms", or "remove the minimum number so none overlap". Reflex: sort, then one pass. Merging or detecting any conflict — sort by start. Selecting the most non-overlapping (or fewest removals) — sort by end, greedy earliest-finish. Counting simultaneous overlap (rooms) — start-sorted sweep plus a min-heap of end times, or split starts and ends into two sorted arrays and two-pointer them. If you catch yourself comparing every interval against every other, you missed the sort.`
    }
  ]
};
