window.LC_LEARN = window.LC_LEARN || {};
window.LC_LEARN[3] = {
  sections: [
    {
      title: "Stack (LIFO): the most recent unresolved thing",
      body: `A stack answers one question fast: "what is the most recent thing I have seen that is not resolved yet?" Push when you meet something that needs a future partner (an opening bracket, a pending operation, a directory you entered). Pop when the partner arrives. Because push and pop are O(1), one linear scan with a stack handles the whole class of matching and nesting problems in O(n).\n\nRecognition: the input has pairs or nesting (brackets, HTML tags, undo/redo, path simplification like "cd .."), or the current element cancels or combines with the most recent one (removing adjacent duplicates, evaluating RPN). If the natural pencil-and-paper approach is "cross out the innermost pair first," it is a stack.\n\nIn Kotlin use ArrayDeque, not java.util.Stack. Stack extends Vector: every operation is synchronized (pointless overhead) and it is a List, so it leaks index access that breaks the LIFO abstraction. ArrayDeque is a plain resizable array, faster, and gives you addLast / removeLast / last() — a clean stack API.`,
      kotlin: `fun isValid(s: String): Boolean {
    val stack = ArrayDeque<Char>()
    val pairs = mapOf(')' to '(', ']' to '[', '}' to '{')
    for (c in s) {
        if (c in "([{") stack.addLast(c)
        else if (stack.isEmpty() || stack.removeLast() != pairs[c]) return false
    }
    return stack.isEmpty()
}`
    },
    {
      title: "Monotonic stack: next greater in O(n)",
      body: `"For each element, find the next greater element to its right." Brute force scans right for every index: O(n^2). The trick is to walk left-to-right keeping a stack of indices whose answer is still unknown, arranged so their values are strictly decreasing from bottom to top. When a new value arrives that is bigger than the top, the new value IS the answer for the top — pop it, record the answer, and keep popping while the new value beats the top. Then push the new index.\n\nWhy O(n): each index is pushed exactly once and popped at most once. The inner while loop looks nested but its total work across the whole run is bounded by n pops. This is amortized analysis — charge each pop to the index being popped, not to the current iteration.\n\nRecognition: "next greater / next warmer / next smaller element", stock spans, largest rectangle in histogram, trapping rain water. Any time the answer for position i is determined by the first later element that crosses a threshold, think monotonic stack. Store indices, not values — you usually need the distance (j - i) or need to write into an answer array.`,
      kotlin: `fun dailyTemperatures(temps: IntArray): IntArray {
    val answer = IntArray(temps.size)
    val stack = ArrayDeque<Int>() // indices, values decreasing
    for (i in temps.indices) {
        while (stack.isNotEmpty() && temps[i] > temps[stack.last()]) {
            val j = stack.removeLast()
            answer[j] = i - j
        }
        stack.addLast(i)
    }
    return answer
}`
    },
    {
      title: "Binary search on indexes",
      body: `Binary search is O(log n) because every comparison discards half of the remaining candidates. The thing that keeps it correct is the invariant: the answer, if it exists, is always inside [lo, hi]. Every line you write must preserve that invariant — when you move lo to mid + 1 you must be certain the answer cannot be at or before mid.\n\nLoop condition follows from the invariant. With inclusive bounds (hi = size - 1) use lo <= hi: the interval [lo, hi] is non-empty exactly while lo <= hi, and when the loop exits the search space is empty, meaning not found. The lo < hi variant pairs with "converge to a single survivor" searches (like finding the minimum in a rotated array) where you never exclude mid itself until it is the only candidate left. Pick one style per problem and be consistent — most off-by-one bugs come from mixing them. Compute mid as lo + (hi - lo) / 2: (lo + hi) / 2 can overflow Int when both are near 2^31 (a real bug that lived in the JDK for years).\n\nRotated sorted array: the array is two sorted halves. Compare nums[mid] with nums[lo] (or nums[hi]) — one side of mid is guaranteed sorted. Check whether the target lies inside that sorted side's range; if yes, search it, otherwise search the other side. Recognition: "sorted array" or "O(log n) required" almost always means binary search on indexes.`,
      kotlin: `fun search(nums: IntArray, target: Int): Int {
    var lo = 0
    var hi = nums.size - 1
    while (lo <= hi) {           // invariant: target can only be in [lo, hi]
        val mid = lo + (hi - lo) / 2
        when {
            nums[mid] == target -> return mid
            nums[mid] < target  -> lo = mid + 1
            else                -> hi = mid - 1
        }
    }
    return -1
}`
    },
    {
      title: "Binary search on the ANSWER space",
      body: `Sometimes nothing in the input is sorted, but the answers are. Koko eating bananas: if she can finish at speed k, she can certainly finish at any speed above k. Feasibility as a function of the candidate answer is monotonic — a wall of falses followed by a wall of trues. Binary search finds the boundary: pick a candidate mid, run a feasibility check canDo(mid), and discard the half that the monotonicity rules out. Total cost is O(check) * O(log(range of answers)), typically O(n log m).\n\nThe pattern has two parts: bounds [lo, hi] that are guaranteed to bracket the answer (lo = smallest conceivable answer, hi = largest, e.g. 1 and max pile size for Koko), and a predicate canDo(k) you can evaluate in linear time. Use the lo < hi converge style: if canDo(mid), mid might be the answer so keep it (hi = mid); otherwise lo = mid + 1. The loop ends with lo == hi at the first feasible value.\n\nRecognition: "minimize the maximum ..." or "maximize the minimum ...", "smallest speed / capacity / days such that ...", split array to minimize largest sum, ship packages within D days. If you can cheaply answer "would answer x be good enough?" and yes-answers form a contiguous range, binary search the answer, not the array.`,
      kotlin: `fun minEatingSpeed(piles: IntArray, h: Int): Int {
    fun canDo(k: Int): Boolean {
        var hours = 0L
        for (p in piles) hours += (p + k - 1L) / k  // ceil(p / k)
        return hours <= h
    }
    var lo = 1
    var hi = piles.max()
    while (lo < hi) {
        val mid = lo + (hi - lo) / 2
        if (canDo(mid)) hi = mid else lo = mid + 1
    }
    return lo  // first k that works
}`
    },
    {
      title: "Recognition cheat-sheet",
      body: `"Valid parentheses", nesting, matching pairs, "remove adjacent duplicates", "simplify path", undo semantics -> plain stack. The current character resolves the most recent open thing.\n\n"Next greater / next smaller / next warmer", stock span, largest rectangle in histogram -> monotonic stack of indices. Answer for i comes from the first later element crossing a threshold; each index pushed and popped once, O(n).\n\n"Sorted array", "rotated sorted array", "find the first/last position", "O(log n) required" -> binary search on indexes; keep the [lo, hi] invariant and mid = lo + (hi - lo) / 2. "Minimize the maximum", "minimum speed/capacity/days such that it fits" -> binary search on the answer space with a canDo predicate; the feasibility function must be monotonic. If a problem gives you an unsorted array but asks for a threshold value, do not sort — ask whether feasibility is monotonic in the answer.`
    }
  ]
};
