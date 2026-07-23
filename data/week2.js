window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 2,
  title: "Two Pointers & Sliding Window",
  goal: "Master converging pointers on sorted data and variable-size windows over strings/arrays.",
  patterns: ["Two Pointers", "Sliding Window"],
  questions: [
    {
      id: "valid-palindrome",
      title: "Valid Palindrome",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/valid-palindrome/",
      pattern: "Two Pointers",
      summary: "Given a string, return true if it reads the same forwards and backwards after keeping only alphanumeric characters and ignoring case.",
      hints: [
        "You don't need to build a cleaned-up copy of the string — think about comparing characters from both ends at once.",
        "Use two pointers, one at each end, skipping non-alphanumeric characters as they meet in the middle."
      ],
      explanation: `The naive approach filters the string down to lowercase alphanumerics, then compares it to its reverse. That works, but it allocates two extra strings. The two-pointer version does the same comparison in place with O(1) extra space.

Place a left pointer at index 0 and a right pointer at the last index. On each iteration, advance left past any non-alphanumeric characters, and move right backwards past any non-alphanumeric characters. Once both point at real characters, compare them case-insensitively. If they differ, the string is not a palindrome — return false. Otherwise move both pointers inward and repeat.

The loop runs while left < right. When the pointers cross, every mirrored pair has matched, so return true. The pattern fits because a palindrome is defined by a symmetric relationship between position i and position n-1-i — exactly what converging pointers walk through.`,
      pitfalls: [
        "Forgetting the left < right guard inside the inner skip loops — a string of only punctuation can push a pointer out of bounds.",
        "Comparing characters without normalizing case ('A' vs 'a').",
        "Treating digits as invalid characters — the problem counts letters AND digits.",
        "An empty string (or all-punctuation string) is a valid palindrome, not an error case."
      ],
      kotlin: `class Solution {
    fun isPalindrome(s: String): Boolean {
        var left = 0
        var right = s.length - 1
        while (left < right) {
            while (left < right && !s[left].isLetterOrDigit()) left++
            while (left < right && !s[right].isLetterOrDigit()) right--
            if (s[left].lowercaseChar() != s[right].lowercaseChar()) return false
            left++
            right--
        }
        return true
    }
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "two-sum-ii-input-array-is-sorted",
      title: "Two Sum II - Input Array Is Sorted",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
      pattern: "Two Pointers",
      summary: "Given a 1-indexed sorted array and a target, return the 1-based indices of the two numbers that add up to the target.",
      hints: [
        "The array is sorted — that ordering tells you something about which direction to look when a candidate pair is too big or too small.",
        "Start pointers at both ends; the sum of the two values tells you exactly which pointer to move."
      ],
      explanation: `Regular Two Sum needs a hash map because the array is unordered. Here the array is sorted, which unlocks a smarter O(1)-space approach: converging pointers.

Put left at the first element and right at the last. Compute the sum of the two values. If it equals the target, you are done. If the sum is too small, the only way to increase it is to move left rightward (right is already at the largest available value). If the sum is too big, move right leftward. Each step permanently discards one element, and it is safe to discard it: if the sum was too small, nums[left] can never pair with anything at or below right, because right already held the biggest remaining partner.

Repeat until the pair is found — the problem guarantees exactly one solution exists. Return the indices plus one, since the answer is 1-indexed.`,
      pitfalls: [
        "Returning 0-based indices — the problem wants 1-based.",
        "Using the O(n) hash-map approach — accepted, but misses the point; the follow-up requires O(1) space.",
        "Moving the wrong pointer (increase the sum by advancing left, decrease it by retreating right).",
        "You cannot use the same element twice, but the two-pointer loop with left < right prevents that automatically."
      ],
      kotlin: `class Solution {
    fun twoSum(numbers: IntArray, target: Int): IntArray {
        var left = 0
        var right = numbers.size - 1
        while (left < right) {
            val sum = numbers[left] + numbers[right]
            when {
                sum == target -> return intArrayOf(left + 1, right + 1)
                sum < target -> left++
                else -> right--
            }
        }
        return intArrayOf(-1, -1)
    }
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "3sum",
      title: "3Sum",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/3sum/",
      pattern: "Two Pointers",
      summary: "Given an integer array, return all unique triplets [a, b, c] such that a + b + c == 0.",
      hints: [
        "If you fix one number, the remaining task looks exactly like a problem you have already solved this week.",
        "Sort the array first, then for each fixed element run a two-pointer Two Sum on the rest of the array, skipping duplicates."
      ],
      explanation: `The brute force is O(n^3) and also produces duplicate triplets. The key insight: sort the array, then reduce 3Sum to n instances of Two Sum II. For each index i, you need two numbers to the right of i that sum to -nums[i], and the sorted suffix lets you find them with converging pointers.

Sort nums. Loop i from 0 to n-1. If nums[i] > 0, stop — three positives can never sum to zero. If nums[i] equals nums[i-1], skip it, because every triplet starting with this value was already found for the previous i. Otherwise set left = i + 1 and right = n - 1 and run the standard two-pointer scan: if the triple sums below zero move left up, if above zero move right down, and on an exact hit record the triplet.

After recording a hit, advance both pointers, and keep advancing left while it equals its previous value — this is what deduplicates triplets that share the same second element. Sorting costs O(n log n); the double loop is O(n^2), which dominates.`,
      pitfalls: [
        "Skipping duplicates for i with the wrong comparison — compare nums[i] to nums[i-1], not nums[i+1], or you will skip valid triplets like [-1, -1, 2].",
        "Forgetting to skip duplicate values for the left pointer after recording a match, producing repeated triplets.",
        "Not sorting first — both the pointer movement logic and dedup depend on sorted order.",
        "Missing the nums[i] > 0 early exit is not wrong, just slower — but breaking on nums[i] >= 0 IS wrong (three zeros sum to zero)."
      ],
      kotlin: `class Solution {
    fun threeSum(nums: IntArray): List<List<Int>> {
        nums.sort()
        val result = mutableListOf<List<Int>>()
        for (i in nums.indices) {
            if (nums[i] > 0) break
            if (i > 0 && nums[i] == nums[i - 1]) continue
            var left = i + 1
            var right = nums.size - 1
            while (left < right) {
                val sum = nums[i] + nums[left] + nums[right]
                when {
                    sum < 0 -> left++
                    sum > 0 -> right--
                    else -> {
                        result.add(listOf(nums[i], nums[left], nums[right]))
                        left++
                        right--
                        while (left < right && nums[left] == nums[left - 1]) left++
                    }
                }
            }
        }
        return result
    }
}`,
      complexity: "Time O(n^2) · Space O(1) extra (ignoring the output)"
    },
    {
      id: "container-with-most-water",
      title: "Container With Most Water",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/container-with-most-water/",
      pattern: "Two Pointers",
      summary: "Given an array of vertical line heights, return the maximum area of water a pair of lines can contain with the x-axis.",
      hints: [
        "Checking every pair is O(n^2). Ask yourself: starting from the widest possible container, which side is ever worth giving up?",
        "Use two pointers at the extremes and always move the pointer at the shorter line inward."
      ],
      explanation: `The area between lines i and j is (j - i) * min(height[i], height[j]) — width times the shorter wall. Brute-forcing all pairs is O(n^2). The two-pointer trick gets it in one pass.

Start with left at 0 and right at the end: the widest container. Compute its area and record the best so far. Now shrink the window, but choose wisely: move the pointer at the SHORTER line inward. Why is that safe? Any container keeping the shorter line but with smaller width is capped by that same short height, so its area is strictly smaller than what we just measured. Nothing is lost by abandoning the shorter side; keeping it can never improve the answer.

Repeat until the pointers meet, updating the maximum area each step. Every element is visited once, giving O(n) time and O(1) space. This is the classic greedy-elimination flavor of two pointers: each move provably discards only suboptimal candidates.`,
      pitfalls: [
        "Moving the taller pointer (or both) — the proof of correctness only works when you drop the shorter wall.",
        "Using max instead of min for the water height — water is limited by the shorter line.",
        "Stopping early when the current area drops — area is not monotonic, you must scan until the pointers meet.",
        "On ties (equal heights) either pointer works; do not overthink it."
      ],
      kotlin: `class Solution {
    fun maxArea(height: IntArray): Int {
        var left = 0
        var right = height.size - 1
        var best = 0
        while (left < right) {
            val area = (right - left) * minOf(height[left], height[right])
            best = maxOf(best, area)
            if (height[left] < height[right]) left++ else right--
        }
        return best
    }
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "best-time-to-buy-and-sell-stock",
      title: "Best Time to Buy and Sell Stock",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
      pattern: "Sliding Window",
      summary: "Given daily stock prices, return the maximum profit from buying on one day and selling on a later day (or 0 if no profit is possible).",
      hints: [
        "You must buy before you sell — as you scan the prices, what single piece of information about the past do you actually need?",
        "Track the minimum price seen so far and, at each day, the profit from selling today at that minimum."
      ],
      explanation: `Checking every buy/sell pair is O(n^2). The one-pass insight: on any given sell day, the best buy day is simply the cheapest price seen before it. So you only need to carry one running value through the scan.

Walk the array once, maintaining minPrice, the lowest price so far. For each price: if it is below minPrice, it becomes the new best buy candidate; otherwise compute price - minPrice (profit from selling today) and keep the maximum such profit seen.

You can view this as a sliding window where the left edge (buy day) jumps forward whenever a new minimum appears — the window never has to reopen behind a lower price because any future sell paired with the new lower buy is at least as good. If prices only decline, no positive profit is ever recorded and the answer stays 0.`,
      pitfalls: [
        "Returning a negative number when prices strictly decrease — the answer must be 0 (do not trade).",
        "Taking max(prices) - min(prices) globally — the sell must come AFTER the buy.",
        "Updating max profit before updating the minimum on the same element in a way that pairs a price with itself is harmless (profit 0), but pairing with a LATER minimum is a real bug.",
        "Single-element input: no transaction possible, answer 0."
      ],
      kotlin: `class Solution {
    fun maxProfit(prices: IntArray): Int {
        var minPrice = Int.MAX_VALUE
        var best = 0
        for (price in prices) {
            if (price < minPrice) {
                minPrice = price
            } else {
                best = maxOf(best, price - minPrice)
            }
        }
        return best
    }
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "longest-substring-without-repeating-characters",
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      pattern: "Sliding Window",
      summary: "Given a string, return the length of its longest substring that contains no repeated characters.",
      hints: [
        "When you hit a character you have already seen, you don't have to restart from scratch — only part of the current stretch is ruined.",
        "Keep a window over the string plus a hash map from character to its last seen index, and jump the window start past the previous occurrence."
      ],
      explanation: `Brute force checks every substring for uniqueness — O(n^3) or O(n^2) with a set. The sliding window observation: if s[start..end] has no repeats and s[end+1] duplicates some s[j] inside the window, then every valid window containing end+1 must start after j. So the start pointer only ever moves forward.

Maintain a map from character to the index where it was last seen, plus a start pointer marking the beginning of the current duplicate-free window. For each index end, look up s[end] in the map. If it was seen at some index at or after start, the window is broken: move start to that index + 1. Then record s[end]'s position and update the best length with end - start + 1.

The "at or after start" check is the subtle part — a stale entry from before the current window must be ignored, not acted on. Each character is processed once and start never retreats, so the whole scan is O(n). Space is O(min(n, alphabet)).`,
      pitfalls: [
        "Moving start backwards when the map holds a stale index from before the window — always take max(start, lastSeen + 1) or check lastSeen >= start.",
        "Shrinking one step at a time with a set works too, but forgetting to remove characters while shrinking breaks it.",
        "Updating the best length before fixing the window start counts an invalid window.",
        "Empty string should return 0."
      ],
      kotlin: `class Solution {
    fun lengthOfLongestSubstring(s: String): Int {
        val lastSeen = HashMap<Char, Int>()
        var start = 0
        var best = 0
        for (end in s.indices) {
            val prev = lastSeen[s[end]]
            if (prev != null && prev >= start) {
                start = prev + 1
            }
            lastSeen[s[end]] = end
            best = maxOf(best, end - start + 1)
        }
        return best
    }
}`,
      complexity: "Time O(n) · Space O(min(n, alphabet))"
    },
    {
      id: "longest-repeating-character-replacement",
      title: "Longest Repeating Character Replacement",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/longest-repeating-character-replacement/",
      pattern: "Sliding Window",
      summary: "Given an uppercase string and an integer k, return the length of the longest substring you can make into all one character by replacing at most k characters.",
      hints: [
        "Rephrase the condition: a window is fixable when (window length) minus (count of its most frequent character) is at most k.",
        "Slide a window with a 26-slot frequency array, tracking the max character count inside the window; when the fix cost exceeds k, advance the left edge."
      ],
      explanation: `A substring can be turned into one repeated character with at most k edits exactly when windowLength - maxFrequencyInWindow <= k: keep the majority character, replace everyone else. That reframing turns the problem into finding the longest window satisfying an invariant — textbook sliding window.

Expand the window one character at a time with the right pointer, updating a 26-entry count array and maxCount, the highest count of any single character currently in the window. If windowLength - maxCount > k, the window is invalid: decrement the count of the character at the left edge and advance left by one. Then update the best answer with the current window length.

The famous trick: maxCount is never decreased when the window shrinks. It may become stale (an overestimate), but that is safe — the answer only improves when a window with a genuinely higher maxCount appears, and a stale maxCount merely lets the window stay at its best-so-far size rather than shrink below it. This keeps the algorithm O(n) with a plain if instead of an inner while.`,
      pitfalls: [
        "Trying to recompute maxCount on every shrink — unnecessary, and doing it naively costs O(26) per step; the stale-maxCount trick avoids it.",
        "Shrinking with while instead of if works, but only if you keep the window-size logic consistent — mixing the two styles causes off-by-one answers.",
        "Window length is end - start + 1; forgetting the +1 is the classic off-by-one here.",
        "k can be 0 — the algorithm must still find the longest run of identical characters."
      ],
      kotlin: `class Solution {
    fun characterReplacement(s: String, k: Int): Int {
        val counts = IntArray(26)
        var start = 0
        var maxCount = 0
        var best = 0
        for (end in s.indices) {
            val idx = s[end] - 'A'
            counts[idx]++
            maxCount = maxOf(maxCount, counts[idx])
            // maxCount may go stale on shrink; that is intentionally safe
            if (end - start + 1 - maxCount > k) {
                counts[s[start] - 'A']--
                start++
            }
            best = maxOf(best, end - start + 1)
        }
        return best
    }
}`,
      complexity: "Time O(n) · Space O(26) = O(1)"
    },
    {
      id: "minimum-window-substring",
      title: "Minimum Window Substring",
      difficulty: "Hard",
      url: "https://leetcode.com/problems/minimum-window-substring/",
      pattern: "Sliding Window",
      summary: "Given strings s and t, return the smallest substring of s that contains every character of t (with multiplicity), or an empty string if none exists.",
      hints: [
        "Grow a range over s until it covers all of t, then ask: how much of the front can I give back while still covering t?",
        "Use a character-needs count array plus a single counter of how many required characters are still missing; expand right to satisfy it, then contract left while it stays satisfied."
      ],
      explanation: `This is the canonical expand/contract sliding window. A window that contains all of t stays valid as you extend it right, and may stay valid as you trim it left — so every position of the right edge has a unique smallest valid window, and both edges only ever move forward.

Build a need array of counts for t. Keep a missing counter equal to t.length: the number of required character instances not yet inside the window. Move right across s; before decrementing need for s[right], if its need is positive this character was genuinely required, so decrement missing. When missing hits zero the window covers t.

Now contract: while the window is valid, record it if it is the shortest so far, then push left forward — increment need for s[left], and if that need becomes positive the window just lost a required character, so increment missing and stop contracting. The counts for characters not in t simply go negative and never affect missing.

Every character enters and leaves the window at most once, so the total work is O(n + m). If missing never reaches zero, no window exists — return the empty string.`,
      pitfalls: [
        "Only decrementing missing when need[c] > 0 BEFORE the decrement — decrementing it for surplus or irrelevant characters breaks validity tracking.",
        "Forgetting to record the best window inside the contraction loop (or recording before the window is valid).",
        "Returning s itself instead of the empty string when no valid window exists — initialize best length to a sentinel and check it.",
        "t longer than s can be short-circuited immediately; also remember t may contain duplicate characters, so a set of chars is not enough."
      ],
      kotlin: `class Solution {
    fun minWindow(s: String, t: String): String {
        if (t.length > s.length) return ""
        val need = IntArray(128)
        for (c in t) need[c.code]++
        var missing = t.length
        var left = 0
        var bestStart = 0
        var bestLen = Int.MAX_VALUE
        for (right in s.indices) {
            val r = s[right].code
            if (need[r] > 0) missing--
            need[r]--
            while (missing == 0) {
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1
                    bestStart = left
                }
                val l = s[left].code
                need[l]++
                if (need[l] > 0) missing++
                left++
            }
        }
        return if (bestLen == Int.MAX_VALUE) "" else s.substring(bestStart, bestStart + bestLen)
    }
}`,
      complexity: "Time O(n + m) · Space O(128) = O(1)"
    }
  ]
});
