window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 6,
  title: "Heap & Intervals",
  goal: "Use PriorityQueue for top-k / closest problems, and sort-then-sweep for interval merging and scheduling.",
  patterns: ["Heap / PriorityQueue", "Sort + Sweep", "Intervals"],
  questions: [
    {
      id: "k-closest-points-to-origin",
      title: "K Closest Points to Origin",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/k-closest-points-to-origin/",
      pattern: "Heap",
      summary: "Given an array of points on a plane and an integer k, return the k points closest to the origin (0, 0).",
      hints: [
        "You never need the points fully sorted by distance — you only need the best k. Is there a structure that keeps a running 'best k so far'?",
        "Keep a max-heap of size k ordered by squared distance; when it grows past k, evict the farthest point at the top."
      ],
      explanation: `The naive approach sorts all points by distance in O(n log n). But you only care about the k closest, so full sorting is wasted work — this is the classic top-k shape where a bounded heap wins.

Maintain a max-heap of at most k points, ordered by distance from the origin (farthest on top). Push each point; whenever the heap size exceeds k, pop the top. The pop always removes the farthest of the current candidates, so after processing all points the heap holds exactly the k closest.

Two practical notes. First, compare by squared distance (x*x + y*y) — square roots are unnecessary since sqrt is monotonic, and avoiding them dodges floating-point issues. Second, the heap must be a MAX-heap: you evict the worst (farthest) candidate, keeping the good ones. At the end, dump the heap contents into an array in any order.

This runs in O(n log k) time and O(k) space, which beats sorting when k is much smaller than n.`,
      pitfalls: [
        "Using a min-heap of size k — that evicts the closest points; you need a max-heap so the farthest is removed.",
        "Computing sqrt for comparisons — squared distance gives the same ordering and stays in integers.",
        "Possible overflow if coordinates were larger; here x*x + y*y fits in Int, but check constraints in similar problems."
      ],
      kotlin: `class Solution {
    fun kClosest(points: Array<IntArray>, k: Int): Array<IntArray> {
        val maxHeap = java.util.PriorityQueue<IntArray>(
            compareByDescending { it[0] * it[0] + it[1] * it[1] }
        )
        for (point in points) {
            maxHeap.offer(point)
            if (maxHeap.size > k) maxHeap.poll()
        }
        return maxHeap.toTypedArray()
    }
}`,
      complexity: "Time O(n log k) · Space O(k)"
    },
    {
      id: "last-stone-weight",
      title: "Last Stone Weight",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/last-stone-weight/",
      pattern: "Heap",
      summary: "Given an array of stone weights, repeatedly smash the two heaviest stones together (they cancel or leave their difference) and return the weight of the last remaining stone, or 0 if none remain.",
      hints: [
        "Every round you need the two heaviest stones — fast. What structure hands you the maximum repeatedly as the collection changes?",
        "Use a max-heap: poll the top two, and if they differ, push the difference back."
      ],
      explanation: `The simulation is spelled out in the problem: take the two heaviest stones, smash them, maybe put a smaller stone back, repeat. The only real question is how to repeatedly get the maximum from a changing collection — re-sorting every round would cost O(n log n) per smash. A max-heap gives you the max in O(log n) per operation, which is exactly the access pattern here.

Build a max-heap from all stones. While the heap has at least two elements: poll the heaviest (y), poll the second heaviest (x). If they are equal, both are destroyed and nothing goes back. If y > x, push y - x back into the heap. Each round removes at least one stone, so the loop terminates.

When the loop ends, the heap has zero or one stones: return the remaining stone's weight, or 0 for an empty heap. In Kotlin, java.util.PriorityQueue is a min-heap by default, so pass a descending comparator (or negate values) to make it a max-heap.`,
      pitfalls: [
        "Forgetting PriorityQueue is a MIN-heap by default — without a descending comparator you smash the lightest stones.",
        "Pushing 0 back into the heap when the stones are equal instead of discarding both.",
        "Not handling the all-stones-destroyed case — return 0 when the heap ends up empty."
      ],
      kotlin: `class Solution {
    fun lastStoneWeight(stones: IntArray): Int {
        val maxHeap = java.util.PriorityQueue<Int>(compareByDescending { it })
        for (stone in stones) maxHeap.offer(stone)
        while (maxHeap.size > 1) {
            val heaviest = maxHeap.poll()
            val second = maxHeap.poll()
            if (heaviest != second) maxHeap.offer(heaviest - second)
        }
        return if (maxHeap.isEmpty()) 0 else maxHeap.peek()
    }
}`,
      complexity: "Time O(n log n) · Space O(n)"
    },
    {
      id: "kth-largest-element-in-an-array",
      title: "Kth Largest Element in an Array",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
      pattern: "Heap",
      summary: "Given an integer array and k, return the kth largest element (in sorted order, not the kth distinct element) without fully sorting if possible.",
      hints: [
        "Full sorting answers a much bigger question than asked. You only need to track the k largest values seen so far.",
        "Keep a min-heap capped at size k — its smallest element (the root) is then the kth largest overall."
      ],
      explanation: `Sorting the whole array works in O(n log n), but you only need one order statistic. The top-k trick: maintain a collection of the k largest elements seen so far, and the answer is the smallest element in that collection. A min-heap makes 'smallest of the collection' free to read and cheap to replace.

Walk through the array pushing every number into a min-heap. Whenever the heap size exceeds k, poll — that discards the smallest of the k+1 candidates, which by definition cannot be among the k largest. After the whole array is processed, the heap holds exactly the k largest numbers, and the root (heap.peek()) is the smallest of them, i.e., the kth largest.

Note the direction: a MIN-heap for the k LARGEST. It feels backwards at first, but the heap root is your eviction point — you throw away small values and protect large ones. Duplicates need no special treatment since the problem counts positions in sorted order, not distinct values.

An alternative is quickselect, which partitions like quicksort but recurses into one side only, giving O(n) average time — worth mentioning in an interview, though the heap version is shorter and has a guaranteed O(n log k) bound.`,
      pitfalls: [
        "Using a max-heap of size k — that keeps the k smallest; the min-heap's root is the eviction point for tracking the k largest.",
        "Popping before pushing, or capping at k-1 — push first, then poll when size exceeds k.",
        "Treating 'kth largest' as 'kth distinct' — duplicates count, so do not deduplicate."
      ],
      kotlin: `class Solution {
    fun findKthLargest(nums: IntArray, k: Int): Int {
        val minHeap = java.util.PriorityQueue<Int>()
        for (num in nums) {
            minHeap.offer(num)
            if (minHeap.size > k) minHeap.poll()
        }
        return minHeap.peek()
    }
}`,
      complexity: "Time O(n log k) · Space O(k)"
    },
    {
      id: "merge-intervals",
      title: "Merge Intervals",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/merge-intervals/",
      pattern: "Intervals",
      summary: "Given an array of intervals, merge all overlapping intervals and return an array of the resulting non-overlapping intervals.",
      hints: [
        "Overlaps are hard to see when intervals are in arbitrary order. What single preprocessing step makes every overlap appear between neighbors?",
        "Sort by start time, then sweep once, extending the last merged interval whenever the next one starts before it ends."
      ],
      explanation: `In arbitrary order, any interval might overlap any other, suggesting an O(n^2) all-pairs check. Sorting by start time collapses that: after sorting, an interval can only overlap the interval(s) immediately before it in the merged result, so one linear sweep suffices. This sort-then-sweep shape is the backbone of almost every interval problem.

Sort intervals by start. Keep an output list; for each interval in order, compare its start against the end of the last interval in the output. If the start is <= that end, they overlap (or touch) — merge by extending the last interval's end to max(last.end, current.end). Otherwise there is a gap, so append the current interval as a new entry.

The max() in the merge step matters: a later interval can be completely contained in an earlier one (e.g. [1,10] then [2,3]), so you cannot just overwrite the end with the current interval's end. Also decide the touching case deliberately — for this problem [1,4] and [4,5] merge into [1,5], so the overlap test uses <=, not <.`,
      pitfalls: [
        "Writing current.end instead of max(last.end, current.end) — fails when an interval is fully contained in the previous one.",
        "Using < instead of <= in the overlap test — touching intervals like [1,4] and [4,5] must merge here.",
        "Forgetting to sort first, or sorting by end instead of start."
      ],
      kotlin: `class Solution {
    fun merge(intervals: Array<IntArray>): Array<IntArray> {
        intervals.sortBy { it[0] }
        val merged = mutableListOf<IntArray>()
        for (interval in intervals) {
            if (merged.isNotEmpty() && interval[0] <= merged.last()[1]) {
                merged.last()[1] = maxOf(merged.last()[1], interval[1])
            } else {
                merged.add(interval)
            }
        }
        return merged.toTypedArray()
    }
}`,
      complexity: "Time O(n log n) · Space O(n)"
    },
    {
      id: "insert-interval",
      title: "Insert Interval",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/insert-interval/",
      pattern: "Intervals",
      summary: "Given a sorted array of non-overlapping intervals and a new interval, insert the new interval and merge as needed so the result stays sorted and non-overlapping.",
      hints: [
        "The input is already sorted and non-overlapping — you should not need to re-sort. Which existing intervals can the new one possibly interact with?",
        "Split the array into three groups: intervals entirely before the new one, intervals that overlap it (absorb these into it), and intervals entirely after."
      ],
      explanation: `Because the input is already sorted and disjoint, the intervals split cleanly into three contiguous groups relative to the new interval: those that end before it starts, those that overlap it, and those that start after it ends. Recognizing this three-phase structure turns the problem into a single linear pass with no sorting.

Phase 1: copy every interval whose end < newInterval's start straight into the result — they are untouched. Phase 2: while the current interval's start <= newInterval's end, it overlaps; absorb it by widening newInterval to [min of starts, max of ends] and advance. When this loop stops, append the (possibly widened) newInterval once. Phase 3: copy all remaining intervals — they start after the merged interval ends.

The overlap condition in phase 2 uses <= on both sides so touching intervals merge, matching Merge Intervals. The most common structural bug is appending newInterval inside the merge loop or forgetting to append it when it overlaps nothing (e.g. it belongs at the very start or very end of the list) — the single append between phase 2 and phase 3 handles every case, including an empty input array.`,
      pitfalls: [
        "Appending the new interval inside the merge loop instead of once after it — it must be added exactly once.",
        "Missing the no-overlap cases where the new interval lands before all, after all, or into an empty array.",
        "Taking only max of ends but not min of starts when absorbing — the new interval can start after an overlapping one."
      ],
      kotlin: `class Solution {
    fun insert(intervals: Array<IntArray>, newInterval: IntArray): Array<IntArray> {
        val result = mutableListOf<IntArray>()
        var current = newInterval
        var i = 0
        while (i < intervals.size && intervals[i][1] < current[0]) {
            result.add(intervals[i])
            i++
        }
        while (i < intervals.size && intervals[i][0] <= current[1]) {
            current = intArrayOf(
                minOf(current[0], intervals[i][0]),
                maxOf(current[1], intervals[i][1])
            )
            i++
        }
        result.add(current)
        while (i < intervals.size) {
            result.add(intervals[i])
            i++
        }
        return result.toTypedArray()
    }
}`,
      complexity: "Time O(n) · Space O(n)"
    },
    {
      id: "non-overlapping-intervals",
      title: "Non-overlapping Intervals",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/non-overlapping-intervals/",
      pattern: "Intervals",
      summary: "Given an array of intervals, return the minimum number of intervals to remove so that the rest are non-overlapping.",
      hints: [
        "Removing the minimum is the same as keeping the maximum number of compatible intervals — a scheduling question. Which interval is always safest to keep first?",
        "Sort by END time and greedily keep any interval that starts at or after the end of the last kept one; count the ones you skip."
      ],
      explanation: `Flip the question: minimizing removals is the same as keeping the maximum number of mutually non-overlapping intervals — the classic activity-selection problem. The greedy insight: among all remaining intervals, the one that ends earliest is always safe to keep, because it frees up the timeline soonest and can never block more future intervals than any alternative choice.

So sort by end time (this is the step people get wrong — sorting by start does NOT work; a long early-starting interval like [1,100] would get kept and wipe out everything after it). Then sweep: track lastEnd, the end of the most recently kept interval. For each interval in order, if its start >= lastEnd it is compatible — keep it and update lastEnd to its end. Otherwise it overlaps a kept interval — count it as removed and move on, leaving lastEnd unchanged.

Note the comparison is >=, not >: in this problem touching intervals such as [1,2] and [2,3] do NOT overlap (opposite of Merge Intervals). The answer is the removal counter. Initialize lastEnd to Int.MIN_VALUE so the first interval is always kept.`,
      pitfalls: [
        "Sorting by start instead of end — a long interval like [1,100] then greedily kept ruins the answer.",
        "Using > instead of >= — here [1,2] and [2,3] are NOT overlapping, unlike in Merge Intervals.",
        "Updating lastEnd when skipping an interval — it must stay at the end of the last KEPT interval."
      ],
      kotlin: `class Solution {
    fun eraseOverlapIntervals(intervals: Array<IntArray>): Int {
        intervals.sortBy { it[1] }
        var removed = 0
        var lastEnd = Int.MIN_VALUE
        for (interval in intervals) {
            if (interval[0] >= lastEnd) {
                lastEnd = interval[1]
            } else {
                removed++
            }
        }
        return removed
    }
}`,
      complexity: "Time O(n log n) · Space O(1)"
    },
    {
      id: "meeting-rooms",
      title: "Meeting Rooms",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/meeting-rooms/",
      pattern: "Intervals",
      summary: "Given an array of meeting time intervals, return true if one person could attend all meetings (i.e., no two intervals overlap).",
      hints: [
        "You only need to know IF any two meetings collide, not which ones. What ordering makes a collision impossible to hide?",
        "Sort by start time — then a conflict can only exist between consecutive meetings, so compare each meeting's start with the previous one's end."
      ],
      explanation: `Checking every pair of meetings for overlap is O(n^2), but sorting exposes the key fact: once meetings are ordered by start time, if any two meetings overlap anywhere in the array, then some ADJACENT pair overlaps. So a single pass over neighbors is a complete check.

Sort intervals by start. For each i from 1 onward, if intervals[i] starts before intervals[i-1] ends (start < previous end), the same person would be in two meetings at once — return false. If the sweep finishes without finding such a pair, return true.

Use strict <, because a meeting starting exactly when the previous one ends ([1,2] then [2,3]) is attendable — back-to-back is fine. Empty or single-element input is trivially true and falls out of the loop naturally. This problem is the minimal template for the sort-then-sweep interval pattern; its follow-up, Meeting Rooms II, adds a heap on top of the same sort.`,
      pitfalls: [
        "Using <= instead of < — back-to-back meetings like [1,2] and [2,3] are allowed.",
        "Comparing each meeting to the first one instead of its immediate predecessor.",
        "Skipping the sort and only checking adjacent pairs in input order."
      ],
      kotlin: `class Solution {
    fun canAttendMeetings(intervals: Array<IntArray>): Boolean {
        intervals.sortBy { it[0] }
        for (i in 1 until intervals.size) {
            if (intervals[i][0] < intervals[i - 1][1]) return false
        }
        return true
    }
}`,
      complexity: "Time O(n log n) · Space O(1)"
    }
  ]
});
