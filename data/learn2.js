window.LC_LEARN = window.LC_LEARN || {};
window.LC_LEARN[2] = {
  sections: [
    {
      title: "Converging Two Pointers: Why Sorted Input Kills O(n²)",
      body: `The brute-force way to find a pair with some property is to check all pairs: O(n²). Converging two pointers gets the same answer in O(n) — but only when the input has structure that lets you make a provable decision at each step. Sorted order is the classic structure: put one pointer at each end, look at the pair, and the comparison tells you which pointer is useless. If arr[left] + arr[right] is too small, then arr[left] paired with ANY element to the left of right is even smaller — so left's current value can never work with anything remaining, and you can discard it forever by moving left++. Symmetrically for right--.

That "discard forever" argument is the whole proof. Each step permanently eliminates one element from consideration, so after at most n steps you are done. You never revisit, you never backtrack — hence linear time, O(1) space. This is the same logical shape as binary search: use ordering to throw away a chunk of the search space per comparison, just a chunk of size 1 instead of n/2.

Sortedness is not the only structure that works. Symmetry does too: palindrome checking compares s[left] to s[right] because the definition of a palindrome is symmetric around the center. Container With Most Water works because moving the shorter wall inward is the only move that can possibly help. The recognition question is always: "when I look at the pair (left, right), can I prove one of the two pointers is done?" If yes, converge.`,
      kotlin: `fun pairSumSorted(arr: IntArray, target: Int): Pair<Int, Int>? {
    var left = 0
    var right = arr.size - 1
    while (left < right) {
        val sum = arr[left] + arr[right]
        when {
            sum == target -> return left to right
            sum < target  -> left++   // arr[left] can't pair with anything remaining
            else          -> right--  // arr[right] can't pair with anything remaining
        }
    }
    return null
}`
    },
    {
      title: "Two-Pointer Variants: Reader/Writer, Pair Sum, and the 3Sum Reduction",
      body: `Same-direction (reader/writer) is the second major shape. Both pointers start at index 0: the reader scans every element, the writer marks the boundary of the "kept" prefix. Whenever the reader sees an element that belongs in the output, copy it to the writer slot and advance the writer. This does in-place filtering and deduplication in O(n) time, O(1) extra space — Remove Duplicates, Move Zeroes, Remove Element are all this one template. The invariant to keep in your head: everything before writer is the finished answer so far.

3Sum shows how converging pointers compose: to find triplets summing to zero, sort the array (O(n log n)), then fix the first element with an outer loop and run the two-pointer pair-sum on the remainder looking for -arr[i]. That turns O(n³) into O(n²). The fiddly part interviews actually test is duplicate skipping: after sorting, equal values sit adjacent, so skip repeats of the fixed element (if arr[i] == arr[i-1] continue) and, after recording a hit, advance left past equal values before continuing. Same trick generalizes to 4Sum with one more outer loop.

A third mini-variant: fast/slow pointers on linked lists (cycle detection, finding the middle). Different data structure, same idea — two pointers moving at different speeds through the same sequence, meeting where the structure forces them to.`,
      kotlin: `// Reader/writer: keep elements matching a predicate, in place.
fun filterInPlace(arr: IntArray, keep: (Int) -> Boolean): Int {
    var write = 0
    for (read in arr.indices) {
        if (keep(arr[read])) {
            arr[write] = arr[read]
            write++
        }
    }
    return write // new logical length; arr[0 until write] is the answer
}`
    },
    {
      title: "Sliding Window: Grow Right, Shrink Left",
      body: `A sliding window is two same-direction pointers that bracket a contiguous range [left, right] of an array or string, plus some cheap running state describing what's inside (a sum, a char-count map, a distinct-count). The engine is always the same loop: extend right by one, update the state, then while the window violates the problem's constraint, shrink from the left (updating state on the way out) until it's valid again. Because left and right each move forward at most n times total, the whole thing is O(n) even though there's a nested while — amortized analysis, not worst-case-per-iteration.

Why does this beat checking all O(n²) subarrays? Same "discard forever" logic as converging pointers: when the window [left, right] becomes invalid, every larger window starting at left is also invalid (the constraint is monotone — adding elements only makes it worse), so left can advance permanently. If the constraint is NOT monotone (e.g. subarray sum equals k with negative numbers allowed), sliding window silently gives wrong answers — that's when you reach for prefix sums + HashMap instead.

Fixed-size windows are the degenerate easy case: right and left move in lockstep at distance k, and you just maintain the state incrementally (add the entering element, remove the leaving one) instead of recomputing per position. Variable-size is where the pattern earns its keep: "longest window such that <constraint>" records the best valid window after each shrink phase; "shortest window such that <requirement>" flips it — shrink while the window is still GOOD and record inside the shrink loop.`,
      kotlin: `fun longestValidWindow(s: String): Int {
    val count = HashMap<Char, Int>()
    var left = 0
    var best = 0
    for (right in s.indices) {
        count.merge(s[right], 1, Int::plus)          // grow
        while (windowInvalid(count)) {               // shrink until valid
            val c = s[left]
            count.merge(c, -1, Int::plus)
            if (count[c] == 0) count.remove(c)
            left++
        }
        best = maxOf(best, right - left + 1)         // window is valid here
    }
    return best
}`
    },
    {
      title: "The Shrink Condition Is the Whole Problem",
      body: `Once you know the template, every sliding-window problem reduces to one question: what makes the window invalid? The loop skeleton is identical; the while-condition is the actual problem. Longest Substring Without Repeating Characters: invalid means the character you just added now has count 2 — shrink while count[s[right]] > 1. Longest Substring with At Most K Distinct: invalid means map.size > k. Minimum Window Substring inverts it: shrink while the window still covers all required characters, recording the best inside the shrink loop.

The elegant one worth memorizing is Longest Repeating Character Replacement: you have a budget of k replacements, and a window is repairable iff windowLen - maxFreq <= k — the characters that are not the majority character are the ones you'd replace. So the shrink condition is windowLen - maxFreq > k. Subtlety that impresses interviewers: maxFreq can be a stale historical maximum and the answer is still correct, because the best answer only improves when a genuinely higher maxFreq appears; a stale value just means some windows aren't extended, never that a wrong answer is recorded.

Practical advice for the interview: write the skeleton first (for right, update state, while invalid shrink, record best), then derive the invalid condition out loud from the problem statement. Also be explicit about state updates being symmetric — whatever you do when an element enters, you must undo when it leaves. Most sliding-window bugs are asymmetric bookkeeping, not wrong conditions.`
    },
    {
      title: "Recognition Cheat-Sheet: Which Tool, and When They Fail",
      body: `Phrases in the problem statement map almost mechanically to tools. "Contiguous subarray/substring" plus "longest/shortest/count such that <monotone constraint>" → sliding window. "Pair/triplet in a SORTED array" or "can sort without breaking the problem" → converging two pointers (sort first if needed and indices don't matter). "Remove/dedupe/partition in place" → reader/writer. "Palindrome" or anything symmetric from both ends → converging pointers. "Linked list middle/cycle" → fast/slow.

Know the failure modes cold, because interviewers probe them. Unsorted pair-sum where you must return original indices (Two Sum): sorting destroys indices and costs O(n log n) anyway — use a HashMap of value-to-index for O(n). Subarray sums with negative numbers: window state isn't monotone, so sliding window breaks — use prefix sum + HashMap. Non-contiguous ("subsequence") problems: windows are contiguous by definition — that's DP or greedy territory.

Complexity summary to state up front in interviews: converging pointers O(n) time O(1) space (plus O(n log n) if you sort); sliding window O(n) time, space O(k) for the window state; 3Sum O(n²) time. If your two-pointer solution wants to move a pointer backward, stop — you've broken the "discard forever" invariant and the approach is wrong for this problem.`
    }
  ]
};
