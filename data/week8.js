window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 8,
  title: "Dynamic Programming",
  goal: "Recognize DP: define the state, write the recurrence, decide iteration order. 1D and classic 2D string DP.",
  patterns: ["1D DP", "Unbounded Knapsack", "2D String DP", "DP on Subsequences"],
  questions: [
    {
      id: "climbing-stairs",
      title: "Climbing Stairs",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/climbing-stairs/",
      pattern: "1D DP",
      summary: "Given n stairs where you can climb 1 or 2 steps at a time, return the number of distinct ways to reach the top.",
      hints: [
        "Think about the very last move you make to arrive at step n. How many options were there, and what does each option leave you standing on?",
        "Let dp[i] be the number of distinct ways to reach step i. Express dp[i] using the answers for the one or two steps just below it."
      ],
      explanation: `State: dp[i] is the number of distinct ways to reach step i. This works because every way to reach step i is fully described by how you got to an earlier step plus one final move.

Recurrence: the last move was either a 1-step from i-1 or a 2-step from i-2, and those two groups of paths are disjoint. So dp[i] = dp[i-1] + dp[i-2] - exactly the Fibonacci recurrence.

Base cases: dp[1] = 1 and dp[2] = 2. Iterate i from 3 up to n; each value depends only on the previous two, so you can keep just two rolling variables instead of an array. The answer is dp[n].

This problem is the template for all 1D DP: once you see that the answer for i decomposes into answers for smaller indices, the rest is bookkeeping.`,
      pitfalls: [
        "Returning n for small inputs without checking: n = 1 must give 1, n = 2 must give 2, so handle n <= 2 before the loop.",
        "Writing the naive recursion without memoization - it is exponential and times out.",
        "Off-by-one in the base cases: dp[2] is 2 (1+1 or 2), not 1."
      ],
      kotlin: `class Solution {
    fun climbStairs(n: Int): Int {
        if (n <= 2) return n
        var prev = 1
        var curr = 2
        for (step in 3..n) {
            val next = prev + curr
            prev = curr
            curr = next
        }
        return curr
    }
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "house-robber",
      title: "House Robber",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/house-robber/",
      pattern: "1D DP",
      summary: "Given an array of house values where you cannot rob two adjacent houses, return the maximum total amount you can rob.",
      hints: [
        "For each house you face a binary choice, and that choice constrains only what you did at the immediately previous house. Try phrasing the best result up to house i in terms of earlier houses.",
        "Let dp[i] be the maximum amount robbable considering only houses 0..i. Think about what the two choices at house i force dp[i] to depend on."
      ],
      explanation: `State: dp[i] is the maximum amount you can rob from the first i+1 houses (indices 0..i). The adjacency constraint only reaches one house back, so this prefix state is enough.

Recurrence: at house i you either skip it, keeping dp[i-1], or rob it, which forbids house i-1 and gives nums[i] + dp[i-2]. So dp[i] = max(dp[i-1], dp[i-2] + nums[i]).

Base cases: dp[0] = nums[0], dp[1] = max(nums[0], nums[1]). Iterate left to right. Since each step reads only the previous two values, two rolling variables suffice - one for dp[i-1] and one for dp[i-2], both starting at 0, which also handles short arrays without special cases. The answer is the last dp value.`,
      pitfalls: [
        "Assuming the answer alternates houses (rob every other one) - the optimal solution can skip two in a row, e.g. [2, 1, 1, 9].",
        "Forgetting the single-house and two-house cases when using explicit dp[0]/dp[1] initialization.",
        "Updating the two rolling variables in the wrong order, so dp[i-2] gets overwritten before it is read."
      ],
      kotlin: `class Solution {
    fun rob(nums: IntArray): Int {
        var prevTwo = 0
        var prevOne = 0
        for (value in nums) {
            val current = maxOf(prevOne, prevTwo + value)
            prevTwo = prevOne
            prevOne = current
        }
        return prevOne
    }
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "coin-change",
      title: "Coin Change",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/coin-change/",
      pattern: "Unbounded Knapsack",
      summary: "Given coin denominations and a target amount, return the fewest coins needed to make that amount, or -1 if it cannot be made.",
      hints: [
        "Greedy (always take the largest coin) fails - try coins [1, 3, 4] with amount 6. Think about building the answer for an amount from answers for smaller amounts.",
        "Let dp[a] be the minimum number of coins needed to make amount a exactly. Consider what removing one last coin from an optimal solution tells you."
      ],
      explanation: `State: dp[a] is the minimum number of coins that sum to exactly a. If an optimal solution for a uses some coin c as its last coin, the rest is an optimal solution for a - c, so subproblems compose.

Recurrence: dp[a] = min over all coins c with c <= a of dp[a - c] + 1. Because each coin can be reused, this is the unbounded knapsack pattern: iterating coins in the outer loop and amounts ascending in the inner loop is fine, and so is the reverse - reuse is allowed either way here since we only track a count, not combinations.

Base case: dp[0] = 0 (zero coins make amount zero). Initialize every other entry to a sentinel meaning "unreachable" - use amount + 1, not Int.MAX_VALUE, because the recurrence adds 1 and MAX_VALUE + 1 overflows to a negative number that then wins every min().

Iterate amounts from 1 to amount. The answer is dp[amount], or -1 if it still holds the sentinel, meaning no combination reaches it.`,
      pitfalls: [
        "Initializing with Int.MAX_VALUE and then computing dp[a - c] + 1 - integer overflow makes it negative and it poisons the min.",
        "Forgetting dp[0] = 0, which breaks every amount that is an exact multiple of a coin.",
        "Returning the sentinel instead of -1 when the amount is unreachable.",
        "Trying a greedy largest-coin-first approach, which fails on inputs like coins [1, 3, 4], amount 6."
      ],
      kotlin: `class Solution {
    fun coinChange(coins: IntArray, amount: Int): Int {
        val unreachable = amount + 1
        val dp = IntArray(amount + 1) { unreachable }
        dp[0] = 0
        for (coin in coins) {
            for (a in coin..amount) {
                dp[a] = minOf(dp[a], dp[a - coin] + 1)
            }
        }
        return if (dp[amount] == unreachable) -1 else dp[amount]
    }
}`,
      complexity: "Time O(n·amount) · Space O(amount)"
    },
    {
      id: "longest-increasing-subsequence",
      title: "Longest Increasing Subsequence",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/longest-increasing-subsequence/",
      pattern: "DP on Subsequences",
      summary: "Given an integer array, return the length of the longest strictly increasing subsequence (elements need not be contiguous).",
      hints: [
        "A subsequence is defined by which elements you keep. Try characterizing the best subsequence that is forced to end at a particular index.",
        "Let dp[i] be the length of the longest strictly increasing subsequence that ends exactly at index i. The global answer is then the max over all i."
      ],
      explanation: `State: dp[i] is the length of the longest strictly increasing subsequence ending exactly at index i. The "ending at i" constraint is the key trick - without it you cannot extend, because you would not know what the last element was.

Recurrence: to extend some earlier subsequence with nums[i], its last element nums[j] must satisfy nums[j] < nums[i] and j < i. So dp[i] = 1 + max(dp[j]) over all such j, or just 1 if no valid j exists (nums[i] starts a fresh subsequence).

Base case: every dp[i] starts at 1, since each element alone is an increasing subsequence of length 1. Iterate i left to right, and for each i scan all j < i. The answer is the maximum of all dp[i] - not dp[n-1], because the best subsequence can end anywhere.

This O(n^2) DP is the expected interview baseline; there is an O(n log n) variant that maintains an array of smallest possible tail values and patience-sorts with binary search, worth mentioning as a follow-up.`,
      pitfalls: [
        "Returning dp[n-1] instead of the max over all dp[i] - the LIS does not have to end at the last element.",
        "Using nums[j] <= nums[i], which allows equal elements; the subsequence must be strictly increasing.",
        "Confusing subsequence with subarray and only considering contiguous runs.",
        "Forgetting to initialize each dp[i] to 1, which zeroes out single-element subsequences."
      ],
      kotlin: `class Solution {
    fun lengthOfLIS(nums: IntArray): Int {
        val dp = IntArray(nums.size) { 1 }
        var best = 1
        for (i in nums.indices) {
            for (j in 0 until i) {
                if (nums[j] < nums[i]) {
                    dp[i] = maxOf(dp[i], dp[j] + 1)
                }
            }
            best = maxOf(best, dp[i])
        }
        return best
    }
}`,
      complexity: "Time O(n^2) · Space O(n)"
    },
    {
      id: "longest-common-subsequence",
      title: "Longest Common Subsequence",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/longest-common-subsequence/",
      pattern: "2D String DP",
      summary: "Given two strings, return the length of their longest common subsequence (characters in order, not necessarily contiguous), or 0 if none exists.",
      hints: [
        "Compare the two strings from the front (or back). What happens to the problem when the first characters match? When they differ, which character can you safely discard?",
        "Let dp[i][j] be the length of the longest common subsequence of the first i characters of text1 and the first j characters of text2."
      ],
      explanation: `State: dp[i][j] is the LCS length of the prefix text1[0..i) and the prefix text2[0..j). Two indices are needed because progress in one string is independent of progress in the other - this is the signature of 2D string DP.

Recurrence: if text1[i-1] == text2[j-1], that character belongs to an optimal LCS of the two prefixes, so dp[i][j] = dp[i-1][j-1] + 1. Otherwise at least one of the two last characters is not in the LCS, so dp[i][j] = max(dp[i-1][j], dp[i][j-1]) - drop one or the other and take the better result.

Base cases: dp[0][j] = 0 and dp[i][0] = 0, since an empty string shares nothing. Using (m+1) x (n+1) sizing makes these the zero-filled first row and column, with no special-casing in the loop.

Iterate i from 1 to m and j from 1 to n (row by row); each cell needs only the cell above, to the left, and diagonally up-left, so all dependencies are already computed. The answer is dp[m][n]. Space can drop to O(min(m, n)) with two rolling rows.`,
      pitfalls: [
        "Indexing dp[i][j] against text1[i]/text2[j] instead of text1[i-1]/text2[j-1] after the +1 offset for empty prefixes.",
        "On a character match, taking max with dp[i-1][j] as well - unnecessary, and a sign the recurrence is not understood (diagonal + 1 is always at least as good).",
        "Sizing the table m x n instead of (m+1) x (n+1) and then fighting empty-prefix edge cases."
      ],
      kotlin: `class Solution {
    fun longestCommonSubsequence(text1: String, text2: String): Int {
        val m = text1.length
        val n = text2.length
        val dp = Array(m + 1) { IntArray(n + 1) }
        for (i in 1..m) {
            for (j in 1..n) {
                dp[i][j] = if (text1[i - 1] == text2[j - 1]) {
                    dp[i - 1][j - 1] + 1
                } else {
                    maxOf(dp[i - 1][j], dp[i][j - 1])
                }
            }
        }
        return dp[m][n]
    }
}`,
      complexity: "Time O(m·n) · Space O(m·n)"
    },
    {
      id: "word-break",
      title: "Word Break",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/word-break/",
      pattern: "1D DP",
      summary: "Given a string s and a dictionary of words, return true if s can be segmented into a sequence of one or more dictionary words (words may be reused).",
      hints: [
        "If some prefix of s can be segmented and the remaining piece up to position i is itself a dictionary word, what does that say about the prefix ending at i?",
        "Let dp[i] be true if the prefix s[0..i) can be segmented into dictionary words. Think about where the last word of such a segmentation could start."
      ],
      explanation: `State: dp[i] is true if the prefix of s with length i (that is, s[0..i)) can be split entirely into dictionary words. Segmentations compose: a valid split of a prefix plus one more dictionary word is a valid split of a longer prefix.

Recurrence: dp[i] is true if there exists any split point j < i such that dp[j] is true and s[j..i) is in the dictionary. Put the dictionary in a hash set first so each membership check is O(1) on the word lookup.

Base case: dp[0] = true - the empty prefix is trivially segmented, and it is what lets a first word starting at index 0 succeed. Iterate end positions i from 1 to s.length, and for each i scan start positions j from 0 to i-1, breaking early once dp[i] becomes true. The answer is dp[s.length].

Word reuse costs nothing extra: the set membership test does not consume words, so the same word can justify many split points.`,
      pitfalls: [
        "Forgetting dp[0] = true, which makes every segmentation fail because no first word can attach to anything.",
        "Greedily matching the longest (or first) dictionary word and recursing - it fails on cases like s = \"aaaaaaa\" with words [\"aaaa\", \"aaa\"] where the split choice matters.",
        "Substring index confusion: dp[i] describes a prefix of length i, so the candidate word is s.substring(j, i), not s.substring(j, i + 1).",
        "Using the list for lookups instead of a hash set, adding an O(k) factor per check."
      ],
      kotlin: `class Solution {
    fun wordBreak(s: String, wordDict: List<String>): Boolean {
        val words = wordDict.toHashSet()
        val dp = BooleanArray(s.length + 1)
        dp[0] = true
        for (end in 1..s.length) {
            for (start in 0 until end) {
                if (dp[start] && s.substring(start, end) in words) {
                    dp[end] = true
                    break
                }
            }
        }
        return dp[s.length]
    }
}`,
      complexity: "Time O(n^2·k) · Space O(n) — k = average word length for substring hashing"
    }
  ]
});
