window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 3,
  title: "Stack & Binary Search",
  goal: "Use stacks (incl. monotonic stacks) for matching and next-greater problems, and binary search on indexes and on answer spaces.",
  patterns: ["Stack", "Monotonic Stack", "Binary Search", "Binary Search on Answer"],
  questions: [
    {
      id: "valid-parentheses",
      title: "Valid Parentheses",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/valid-parentheses/",
      pattern: "Stack",
      summary: "Given a string containing only the characters '(', ')', '{', '}', '[' and ']', return true if every opening bracket is closed by the same type of bracket in the correct order.",
      hints: [
        "Whenever you see a closing bracket, which opening bracket must it match? Think about what 'most recent unmatched opener' means.",
        "Push opening brackets onto a stack; on a closing bracket, the top of the stack must be the matching opener, otherwise the string is invalid."
      ],
      explanation: `The key observation is that a closing bracket must always match the most recently opened, not-yet-closed bracket. "Most recent thing first" is exactly last-in-first-out behavior, which is what a stack gives you.

Scan the string left to right. When you see an opening bracket, push it on the stack. When you see a closing bracket, look at the top of the stack: if the stack is empty or the top is not the corresponding opener, the string is invalid; otherwise pop the opener because that pair is now matched.

At the end, the string is valid only if the stack is empty. A non-empty stack means some opening brackets were never closed. A common trick that keeps the code tiny: when you see an opener, push the closer you expect (e.g. see '(' push ')'), then a closing character is valid only if it equals the popped value.`,
      pitfalls: [
        "Forgetting to check the stack is empty at the end — \"(((\" must return false.",
        "Popping from an empty stack when the string starts with a closer, e.g. \")(\".",
        "Matching bracket count but not type/order, e.g. \"([)]\" is invalid."
      ],
      kotlin: `class Solution {
    fun isValid(s: String): Boolean {
        val expected = ArrayDeque<Char>()
        for (c in s) {
            when (c) {
                '(' -> expected.addLast(')')
                '[' -> expected.addLast(']')
                '{' -> expected.addLast('}')
                else -> if (expected.isEmpty() || expected.removeLast() != c) return false
            }
        }
        return expected.isEmpty()
    }
}`,
      complexity: "Time O(n) · Space O(n)"
    },
    {
      id: "min-stack",
      title: "Min Stack",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/min-stack/",
      pattern: "Stack",
      summary: "Design a stack that supports push, pop, top, and retrieving the minimum element, all in O(1) time.",
      hints: [
        "You can't rescan the stack to find the minimum after a pop — what if every element remembered something extra about the state when it was pushed?",
        "Keep a second stack (or store pairs) that tracks the minimum of everything at or below each element; it moves in lockstep with the main stack."
      ],
      explanation: `The hard part is getMin after pops: if you only store one running minimum, popping the current minimum leaves you with no way to recover the previous one in O(1). The fix is to remember, for every element, what the minimum was at the moment it was pushed.

Maintain two stacks. The main stack holds the values as usual. The min stack holds, at each level, the minimum of all elements from the bottom up to that level. On push(x), push x on the main stack and push min(x, current top of min stack) on the min stack. On pop, pop both. Then top() is the main stack's top and getMin() is the min stack's top — both O(1).

This works because the min stack's top is always the minimum of exactly the elements still in the main stack: pushes and pops keep the two perfectly aligned, so popping the minimum automatically 'restores' the previous minimum underneath it. You can also store (value, minSoFar) pairs in a single stack; it is the same idea.`,
      pitfalls: [
        "Only tracking a single min variable — it breaks as soon as the minimum is popped.",
        "Pushing onto the min stack only when the new value is strictly smaller — duplicates of the minimum then break pop (use <= or always push).",
        "Forgetting to pop both stacks together, letting them drift out of sync."
      ],
      kotlin: `class MinStack {
    private val stack = ArrayDeque<Int>()
    private val mins = ArrayDeque<Int>()

    fun push(v: Int) {
        stack.addLast(v)
        mins.addLast(if (mins.isEmpty()) v else minOf(v, mins.last()))
    }

    fun pop() {
        stack.removeLast()
        mins.removeLast()
    }

    fun top(): Int = stack.last()

    fun getMin(): Int = mins.last()
}`,
      complexity: "Time O(1) per operation · Space O(n)"
    },
    {
      id: "daily-temperatures",
      title: "Daily Temperatures",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/daily-temperatures/",
      pattern: "Monotonic Stack",
      summary: "Given an array of daily temperatures, return an array where answer[i] is the number of days you have to wait after day i to get a warmer temperature, or 0 if it never happens.",
      hints: [
        "Brute force scans forward from every day. Notice that once a warmer day arrives, it answers the question for possibly many earlier days at once.",
        "Keep a stack of indexes whose answer is still unknown; when a new temperature is warmer than the temperature at the top index, you just found that index's answer."
      ],
      explanation: `This is the classic 'next greater element' shape: for each position, find the first later position with a bigger value. The brute force is O(n^2). The insight is that days waiting for a warmer day form a decreasing sequence of temperatures — if day A is before day B and A is cooler than B, then A would already have been resolved by B. That decreasing structure is what a monotonic stack maintains.

Walk through the days left to right, keeping a stack of indexes with strictly decreasing temperatures. For each new day i: while the stack is non-empty and temperatures[i] is warmer than the temperature at the top index j, pop j and set answer[j] = i - j. Then push i. Days left on the stack at the end never see a warmer day, so their answer stays 0.

Each index is pushed once and popped at most once, so despite the nested while loop the total work is O(n). Storing indexes (not temperatures) on the stack is essential because the answer is a distance in days.`,
      pitfalls: [
        "Storing temperatures on the stack instead of indexes — you lose the ability to compute i - j.",
        "Using >= instead of > when popping — equal temperatures are not 'warmer'.",
        "Forgetting that unresolved indexes must be left as 0, not -1."
      ],
      kotlin: `class Solution {
    fun dailyTemperatures(temperatures: IntArray): IntArray {
        val answer = IntArray(temperatures.size)
        val waiting = ArrayDeque<Int>() // indexes with decreasing temperatures
        for (i in temperatures.indices) {
            while (waiting.isNotEmpty() && temperatures[i] > temperatures[waiting.last()]) {
                val j = waiting.removeLast()
                answer[j] = i - j
            }
            waiting.addLast(i)
        }
        return answer
    }
}`,
      complexity: "Time O(n) · Space O(n)"
    },
    {
      id: "car-fleet",
      title: "Car Fleet",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/car-fleet/",
      pattern: "Monotonic Stack",
      summary: "Given cars' starting positions and speeds on a one-lane road toward a target, where a faster car that catches a slower one merges into a fleet at the slower car's speed, return how many fleets arrive at the target.",
      hints: [
        "Cars can't pass each other, so think about each car's arrival time at the target if nothing were in its way — and what happens when a car behind would arrive sooner than the car ahead.",
        "Sort cars by position closest-to-target first, compute each car's solo arrival time, and use a stack of fleet arrival times: a car merges if its time is <= the time on top."
      ],
      explanation: `Because the road has one lane, a car can never pass the car ahead of it. So the only thing that matters for each car is its solo arrival time at the target: (target - position) / speed. If a car behind has a solo time less than or equal to the car ahead, it catches up before the target and joins that car's fleet — and the fleet keeps the slower (larger) arrival time.

Sort the cars by starting position in descending order (closest to the target first) and process them in that order. Maintain a stack of arrival times, one per fleet. For each car, compute its solo time t. If the stack is non-empty and t <= stack top, this car catches the fleet ahead, so it merges — push nothing. Otherwise t > top means it never catches up, so it forms a new fleet — push t.

The stack ends up strictly increasing from bottom to top, which is the monotonic-stack flavor here: each fleet behind must be strictly slower to arrive than the one ahead of it. The answer is simply the stack size. In practice you only ever compare against the top, so a single variable tracking the last fleet's time works too.`,
      pitfalls: [
        "Sorting by position ascending and getting the merge direction backwards.",
        "Using integer division for arrival times — use doubles or a cross-multiplication comparison.",
        "Treating t == top as a new fleet — equal arrival time means the car merges into the fleet.",
        "Forgetting positions and speeds must be paired before sorting."
      ],
      kotlin: `class Solution {
    fun carFleet(target: Int, position: IntArray, speed: IntArray): Int {
        val order = position.indices.sortedByDescending { position[it] }
        var fleets = 0
        var slowestTime = 0.0
        for (i in order) {
            val time = (target - position[i]).toDouble() / speed[i]
            if (time > slowestTime) {
                fleets++
                slowestTime = time
            }
        }
        return fleets
    }
}`,
      complexity: "Time O(n log n) · Space O(n)"
    },
    {
      id: "evaluate-reverse-polish-notation",
      title: "Evaluate Reverse Polish Notation",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/",
      pattern: "Stack",
      summary: "Given an array of tokens representing an arithmetic expression in Reverse Polish (postfix) notation with +, -, *, /, evaluate it and return the integer result.",
      hints: [
        "In postfix notation an operator applies to the values that appeared immediately before it — which values are those at any point in the scan?",
        "Push numbers onto a stack; when you hit an operator, pop the top two values, apply it, and push the result back."
      ],
      explanation: `Reverse Polish notation is designed for stack evaluation: every operator acts on the two most recently produced values. 'Most recently produced' is again last-in-first-out, so a stack is the natural fit and no parentheses or precedence rules are needed.

Scan the tokens in order. If a token is a number, push it. If it is an operator, pop twice — the first pop is the right operand, the second is the left operand — apply the operator, and push the result. After processing all tokens exactly one value remains on the stack; that is the answer.

The one detail that trips people up is operand order for the non-commutative operators: for tokens [..., a, b, "-"] the result is a - b, so the value popped first is the right-hand side. Division truncates toward zero, which is what JVM integer division already does, so Kotlin's / is correct here.`,
      pitfalls: [
        "Swapping operand order for - and / (the first pop is the right operand).",
        "Parsing \"-3\" as an operator because you only checked the first character — match the whole token.",
        "Worrying about rounding: division must truncate toward zero, which JVM Int division does natively."
      ],
      kotlin: `class Solution {
    fun evalRPN(tokens: Array<String>): Int {
        val stack = ArrayDeque<Int>()
        for (token in tokens) {
            when (token) {
                "+", "-", "*", "/" -> {
                    val right = stack.removeLast()
                    val left = stack.removeLast()
                    stack.addLast(
                        when (token) {
                            "+" -> left + right
                            "-" -> left - right
                            "*" -> left * right
                            else -> left / right
                        }
                    )
                }
                else -> stack.addLast(token.toInt())
            }
        }
        return stack.last()
    }
}`,
      complexity: "Time O(n) · Space O(n)"
    },
    {
      id: "binary-search",
      title: "Binary Search",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/binary-search/",
      pattern: "Binary Search",
      summary: "Given a sorted array of distinct integers and a target, return the index of the target or -1 if it is not present, in O(log n) time.",
      hints: [
        "The array is sorted — comparing the target with one well-chosen element tells you which entire half you can throw away.",
        "Maintain lo and hi pointers, probe the middle, and shrink the search range by half each step until the pointers cross."
      ],
      explanation: `Sorted order means one comparison against the middle element eliminates half the array: if nums[mid] < target the answer can only be to the right, if nums[mid] > target only to the left. Repeating this halves the search space each step, giving O(log n).

Keep two indexes, lo = 0 and hi = n - 1, defining the inclusive range that could still contain the target. Loop while lo <= hi: compute mid = lo + (hi - lo) / 2, then compare. Equal — return mid. nums[mid] < target — set lo = mid + 1. Otherwise set hi = mid - 1. If the loop exits, the range became empty and the target is absent, so return -1.

Two details matter and recur in every binary search problem. First, mid = lo + (hi - lo) / 2 avoids the overflow that (lo + hi) / 2 can hit with large indexes. Second, always move a pointer past mid (mid + 1 or mid - 1); leaving mid inside the range causes infinite loops. Get this template airtight — the next three problems are variations on it.`,
      pitfalls: [
        "Computing mid as (lo + hi) / 2, which can overflow for large arrays.",
        "Using lo < hi with mid-inclusive updates and looping forever, or missing the last element.",
        "Off-by-one on the initial hi (n vs n - 1) depending on inclusive vs exclusive convention — pick one and be consistent."
      ],
      kotlin: `class Solution {
    fun search(nums: IntArray, target: Int): Int {
        var lo = 0
        var hi = nums.size - 1
        while (lo <= hi) {
            val mid = lo + (hi - lo) / 2
            when {
                nums[mid] == target -> return mid
                nums[mid] < target -> lo = mid + 1
                else -> hi = mid - 1
            }
        }
        return -1
    }
}`,
      complexity: "Time O(log n) · Space O(1)"
    },
    {
      id: "search-in-rotated-sorted-array",
      title: "Search in Rotated Sorted Array",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
      pattern: "Binary Search",
      summary: "Given a sorted array of distinct integers that has been rotated at an unknown pivot, and a target, return the target's index or -1 in O(log n) time.",
      hints: [
        "The array isn't fully sorted, but look at any middle element: at least one of the two halves around it is still perfectly sorted.",
        "Binary search where each step first identifies the sorted half, then checks whether the target lies inside that half's value range to decide which side to keep."
      ],
      explanation: `A rotated sorted array is two sorted runs glued together. The crucial property: for any mid, at least one of the halves [lo..mid] or [mid..hi] contains no rotation point and is therefore fully sorted. You can detect which one with a single comparison: if nums[lo] <= nums[mid], the left half is sorted; otherwise the right half is.

That sorted half is the one you can reason about. If the left half is sorted and nums[lo] <= target < nums[mid], the target must be in the left half, so set hi = mid - 1; otherwise it can only be in the right half, so lo = mid + 1. Symmetrically, if the right half is sorted and nums[mid] < target <= nums[hi], go right; otherwise go left.

So the loop is standard binary search with a two-stage decision at each step: (1) which half is sorted, (2) is the target inside that half's range. Either way you discard half the array, keeping O(log n). Return mid immediately when nums[mid] == target, and -1 when lo passes hi.`,
      pitfalls: [
        "Using < instead of <= in nums[lo] <= nums[mid] — a one-element half is sorted, and strict < misclassifies it.",
        "Range checks with the wrong inclusivity: target can equal nums[lo] or nums[hi] but never nums[mid] at that point.",
        "Assuming duplicates are allowed — this variant guarantees distinct values, and the trick relies on it."
      ],
      kotlin: `class Solution {
    fun search(nums: IntArray, target: Int): Int {
        var lo = 0
        var hi = nums.size - 1
        while (lo <= hi) {
            val mid = lo + (hi - lo) / 2
            if (nums[mid] == target) return mid
            if (nums[lo] <= nums[mid]) {
                if (target >= nums[lo] && target < nums[mid]) hi = mid - 1 else lo = mid + 1
            } else {
                if (target > nums[mid] && target <= nums[hi]) lo = mid + 1 else hi = mid - 1
            }
        }
        return -1
    }
}`,
      complexity: "Time O(log n) · Space O(1)"
    },
    {
      id: "find-minimum-in-rotated-sorted-array",
      title: "Find Minimum in Rotated Sorted Array",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
      pattern: "Binary Search",
      summary: "Given a sorted array of distinct integers rotated at an unknown pivot, return the minimum element in O(log n) time.",
      hints: [
        "The minimum is the single point where the sorted order 'breaks'. Compare a middle element with an endpoint — what does the result tell you about which side the break is on?",
        "Binary search comparing nums[mid] with nums[hi]: if nums[mid] > nums[hi] the minimum is strictly to the right of mid, otherwise it is at mid or to the left."
      ],
      explanation: `The minimum is the rotation point — the one place where a bigger value is followed by a smaller one. Everything to its right is smaller than everything to its left, and comparing nums[mid] against nums[hi] tells you which side of mid that point is on.

If nums[mid] > nums[hi], the break lies somewhere in (mid, hi], because a sorted-without-rotation segment would have nums[mid] <= nums[hi]. So set lo = mid + 1 — mid itself cannot be the minimum. If nums[mid] < nums[hi], the segment from mid to hi is sorted, so the minimum is at mid or to its left: set hi = mid (keep mid, it might be the answer).

Loop while lo < hi; when they meet, that index holds the minimum. Note the asymmetry with plain binary search: one branch excludes mid, the other keeps it, and the loop condition is strict. Comparing against nums[hi] rather than nums[lo] is deliberate — an already-sorted (rotation of 0) array works cleanly with the hi comparison but breaks the naive lo version.`,
      pitfalls: [
        "Comparing nums[mid] with nums[lo] — fails when the array isn't actually rotated.",
        "Setting hi = mid - 1 when nums[mid] < nums[hi], discarding the possible answer at mid.",
        "Using lo <= hi with this pattern, which loops forever once lo == hi."
      ],
      kotlin: `class Solution {
    fun findMin(nums: IntArray): Int {
        var lo = 0
        var hi = nums.size - 1
        while (lo < hi) {
            val mid = lo + (hi - lo) / 2
            if (nums[mid] > nums[hi]) lo = mid + 1 else hi = mid
        }
        return nums[lo]
    }
}`,
      complexity: "Time O(log n) · Space O(1)"
    },
    {
      id: "koko-eating-bananas",
      title: "Koko Eating Bananas",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/koko-eating-bananas/",
      pattern: "Binary Search on Answer",
      summary: "Given piles of bananas and h hours, where Koko eats from one pile at speed k bananas per hour (finishing a pile ends that hour's eating), return the minimum integer speed k that finishes all piles within h hours.",
      hints: [
        "You're not searching the array — you're searching for a number k. Notice that if some speed works, every faster speed also works.",
        "Binary search over the speed range 1..max(piles); for each candidate speed, compute the total hours needed and keep the smallest speed that fits in h."
      ],
      explanation: `This is binary search on the answer space, not on the input array. The feasibility function is monotone: if Koko can finish at speed k, she can certainly finish at any speed greater than k. A monotone yes/no property over a numeric range is exactly what binary search needs — you are looking for the boundary where 'too slow' flips to 'fast enough'.

Checking one candidate speed k is easy: each pile of p bananas takes ceil(p / k) hours (a pile smaller than k still consumes a full hour), so sum that over all piles and compare with h. The answer lies between lo = 1 and hi = max(piles) — eating faster than the largest pile never helps, since at most one pile fits per hour.

Binary search that range: while lo < hi, take mid, compute the hours needed at speed mid. If hours <= h, speed mid is feasible, so the answer is mid or smaller — set hi = mid. Otherwise mid is too slow — set lo = mid + 1. When the pointers meet, lo is the minimum feasible speed. Compute ceil without floating point as (p + k - 1) / k, and use Long for the hour sum to be safe with large inputs.`,
      pitfalls: [
        "Integer ceil done wrong: p / k rounds down — use (p + k - 1) / k.",
        "Summing hours in Int can overflow with large piles and small k — accumulate in Long.",
        "Starting lo at 0, which causes division by zero.",
        "Setting hi = mid - 1 on a feasible mid, which can skip the optimal answer."
      ],
      kotlin: `class Solution {
    fun minEatingSpeed(piles: IntArray, h: Int): Int {
        var lo = 1
        var hi = piles.max()
        while (lo < hi) {
            val mid = lo + (hi - lo) / 2
            var hours = 0L
            for (p in piles) hours += ((p + mid - 1) / mid).toLong()
            if (hours <= h) hi = mid else lo = mid + 1
        }
        return lo
    }
}`,
      complexity: "Time O(n log m) where m = max pile · Space O(1)"
    }
  ]
});
