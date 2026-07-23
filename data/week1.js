window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 1,
  title: "Arrays, Hash Maps & Strings",
  goal: "Learn the most common patterns: hash-based lookup, frequency counting, and prefix/suffix products.",
  patterns: ["HashMap", "HashSet", "Frequency Map", "Prefix/Suffix Arrays"],
  questions: [
    {
      id: "two-sum",
      title: "Two Sum",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/two-sum/",
      pattern: "HashMap",
      summary: "Given an array of integers and a target, return the indices of the two numbers that add up to the target.",
      hints: [
        "The brute force checks every pair. As you scan the array, what single piece of information would let you know instantly whether the current number has a partner you already passed?",
        "Use a HashMap from value to index. For each number, look up (target - number) before inserting the number itself."
      ],
      explanation: `The core idea is to turn a pair-search into a single-pass lookup. For each number x, its required partner is exactly target - x. Instead of scanning the rest of the array to find that partner (which is O(n) per element, O(n^2) total), you remember every number you have already seen in a HashMap, so the lookup becomes O(1).

A hash map fits because the question "have I seen value v before, and where?" is exactly what a map from value to index answers in constant time.

Algorithm: walk the array left to right with an empty map. At index i with value x, compute complement = target - x. If the map contains the complement, return [map[complement], i]. Otherwise store x -> i in the map and continue. Because you check before inserting, you never pair an element with itself, and since the problem guarantees exactly one answer, the loop always finds it.`,
      pitfalls: [
        "Inserting the current element into the map before checking for its complement can wrongly pair an element with itself (e.g. target 6 with a single 3).",
        "Returning values instead of indices — the problem asks for indices.",
        "Duplicates are fine with check-then-insert, but overwriting an index you still need is a bug if you insert first."
      ],
      kotlin: `class Solution {
    fun twoSum(nums: IntArray, target: Int): IntArray {
        val seen = HashMap<Int, Int>()
        for (i in nums.indices) {
            val complement = target - nums[i]
            seen[complement]?.let { return intArrayOf(it, i) }
            seen[nums[i]] = i
        }
        return intArrayOf()
    }
}`,
      complexity: "Time O(n) · Space O(n)"
    },
    {
      id: "contains-duplicate",
      title: "Contains Duplicate",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/contains-duplicate/",
      pattern: "HashSet",
      summary: "Given an integer array, return true if any value appears at least twice, and false if every element is distinct.",
      hints: [
        "You only need to know whether a number has appeared before — not where or how many times. What structure answers membership questions in O(1)?",
        "Add each element to a HashSet as you go; if an element is already in the set, you found a duplicate."
      ],
      explanation: `The question reduces to: while scanning the array, has the current value appeared earlier? A HashSet answers "is v already in the set?" in expected O(1), so one pass is enough.

Algorithm: create an empty set. For each number, check membership; if it is already there, return true immediately. Otherwise add it and continue. If the loop finishes, all elements were distinct, so return false.

Two common alternatives are worth knowing for interviews: sorting first and checking adjacent pairs gives O(n log n) time with O(1) extra space, and the brute-force pair check is O(n^2). The set trades a little memory for the fastest time.

In Kotlin, Set.add returns false when the element was already present, which collapses the check-and-insert into one call.`,
      pitfalls: [
        "Comparing only adjacent elements without sorting first — duplicates can be far apart.",
        "An empty or single-element array has no duplicates; make sure the loop simply returns false.",
        "Using a list instead of a set makes the membership check O(n) and the whole thing O(n^2)."
      ],
      kotlin: `class Solution {
    fun containsDuplicate(nums: IntArray): Boolean {
        val seen = HashSet<Int>()
        for (num in nums) {
            if (!seen.add(num)) return true
        }
        return false
    }
}`,
      complexity: "Time O(n) · Space O(n)"
    },
    {
      id: "valid-anagram",
      title: "Valid Anagram",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/valid-anagram/",
      pattern: "Frequency Map",
      summary: "Given two strings s and t, return true if t is an anagram of s (same characters with the same multiplicities).",
      hints: [
        "Two strings are anagrams exactly when they contain the same letters the same number of times. How could you compare those counts without sorting?",
        "Count character frequencies — with the input limited to lowercase letters, a 26-slot int array works as the map."
      ],
      explanation: `Two strings are anagrams if and only if every character occurs the same number of times in both. So instead of comparing arrangements, compare frequency counts.

A frequency map fits because order is irrelevant; only multiplicities matter. Since LeetCode's input is lowercase English letters, an IntArray of size 26 indexed by (char - 'a') is the cheapest possible frequency map.

Algorithm: first, if the lengths differ, return false immediately — anagrams must be the same length. Then walk both strings in one loop: increment the counter for the character from s and decrement for the character from t. At the end, every slot must be zero; any nonzero slot means a character surplus in one string.

The sorting alternative (sort both, compare) is correct but O(n log n); counting is O(n) and just as simple.`,
      pitfalls: [
        "Forgetting the length check — 'ab' vs 'abb' can otherwise slip through some counting implementations.",
        "If the problem is extended to Unicode, a fixed 26-slot array breaks; switch to a HashMap<Char, Int>.",
        "Only incrementing for both strings and comparing 'seen' sets ignores multiplicities ('aab' vs 'abb')."
      ],
      kotlin: `class Solution {
    fun isAnagram(s: String, t: String): Boolean {
        if (s.length != t.length) return false
        val counts = IntArray(26)
        for (i in s.indices) {
            counts[s[i] - 'a']++
            counts[t[i] - 'a']--
        }
        return counts.all { it == 0 }
    }
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "group-anagrams",
      title: "Group Anagrams",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/group-anagrams/",
      pattern: "HashMap",
      summary: "Given an array of strings, group the strings that are anagrams of each other and return the groups in any order.",
      hints: [
        "Anagrams share something that stays identical no matter how the letters are shuffled. Can you compute that invariant and use it as a label for each word?",
        "Use a HashMap from a canonical key to a list of words — the sorted word (or its letter-count signature) is the key."
      ],
      explanation: `The trick is to find a canonical form: a key that is identical for all anagrams of a word and different for everything else. Two natural choices are the word with its letters sorted ('eat', 'tea', 'ate' all become 'aet'), or the 26-letter count signature.

A hash map fits because grouping is exactly "bucket items by key": map each canonical key to the list of original words that produce it.

Algorithm: for each word, compute its key (sort its characters), then append the original word to the map entry for that key, creating the list if needed. Kotlin's getOrPut does the create-or-fetch in one call. Finally return all the map's values.

Sorting each word costs O(k log k) for word length k. If words are long, the counting signature (an IntArray of 26 counts turned into a string key) makes the key computation O(k) instead — same idea, cheaper key.`,
      pitfalls: [
        "Using the sorted word for grouping but forgetting to add the ORIGINAL word to the bucket.",
        "Building a count-based key by concatenating raw digits without separators — counts like 1,12 and 11,2 can collide.",
        "An empty string is a valid word and must form or join a group, not be skipped."
      ],
      kotlin: `class Solution {
    fun groupAnagrams(strs: Array<String>): List<List<String>> {
        val groups = HashMap<String, MutableList<String>>()
        for (word in strs) {
            val key = String(word.toCharArray().apply { sort() })
            groups.getOrPut(key) { mutableListOf() }.add(word)
        }
        return groups.values.toList()
    }
}`,
      complexity: "Time O(n · k log k) · Space O(n · k)"
    },
    {
      id: "top-k-frequent-elements",
      title: "Top K Frequent Elements",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/top-k-frequent-elements/",
      pattern: "Frequency Map",
      summary: "Given an integer array and an integer k, return the k most frequent elements in any order.",
      hints: [
        "Step one is clearly counting how often each value appears. The interesting part is picking the top k without fully sorting — what do you know about the maximum possible frequency?",
        "After building a frequency map, use bucket sort: an array of buckets indexed by frequency (0..n), then collect from the highest bucket down."
      ],
      explanation: `Start with the obvious half: a frequency map counting occurrences of each value. The real question is how to extract the k largest counts efficiently.

The key observation for the optimal solution: a frequency can never exceed n, the array length. That bounded range makes bucket sort possible — create n+1 buckets where bucket[f] holds all values that occur exactly f times. Distributing map entries into buckets is O(n), no comparison sort needed.

Algorithm: (1) count frequencies into a HashMap. (2) Create an array of n+1 lists and drop each distinct value into the bucket matching its count. (3) Walk the buckets from index n down to 1, appending values to the result until it holds k elements.

Simpler alternatives that also pass: sort the map entries by count descending (O(n log n)), or keep a min-heap of size k (O(n log k)). Bucket sort is the O(n) answer interviewers like, and the problem guarantees the answer is unique, so ties inside a bucket do not matter.`,
      pitfalls: [
        "Sizing the bucket array to n instead of n+1 — a single repeated value has frequency n exactly.",
        "Iterating buckets from low to high frequency returns the LEAST frequent elements.",
        "Stopping condition: collect until the result has k elements; a bucket may contribute more than one value.",
        "k can equal the number of distinct elements — the loop must handle returning everything."
      ],
      kotlin: `class Solution {
    fun topKFrequent(nums: IntArray, k: Int): IntArray {
        val counts = HashMap<Int, Int>()
        for (num in nums) counts[num] = (counts[num] ?: 0) + 1

        val buckets = Array(nums.size + 1) { mutableListOf<Int>() }
        for ((value, count) in counts) buckets[count].add(value)

        val result = IntArray(k)
        var filled = 0
        for (freq in nums.size downTo 1) {
            for (value in buckets[freq]) {
                result[filled++] = value
                if (filled == k) return result
            }
        }
        return result
    }
}`,
      complexity: "Time O(n) · Space O(n)"
    },
    {
      id: "product-of-array-except-self",
      title: "Product of Array Except Self",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/product-of-array-except-self/",
      pattern: "Prefix/Suffix Arrays",
      summary: "Given an integer array, return an array where each position holds the product of all other elements, without using division and in O(n) time.",
      hints: [
        "The product of everything except position i splits naturally into two parts relative to i. Can you precompute each part for every index?",
        "Build prefix products (everything left of i) and suffix products (everything right of i); the answer at i is their product. Both can be done with running variables."
      ],
      explanation: `The product of all elements except index i is exactly (product of everything to the left of i) times (product of everything to the right of i). That decomposition is the whole solution — no division needed, which also sidesteps the divide-by-zero problem.

Prefix/suffix precomputation fits because both parts are cumulative: prefix[i] extends prefix[i-1] by one factor, and likewise for suffixes from the right. Each can be computed in a single pass.

Algorithm with O(1) extra space (output array not counted): first pass left to right, store in result[i] the product of all elements before i (result[0] = 1). Second pass right to left, carry a running suffix product initialized to 1; multiply result[i] by it, then multiply the running suffix by nums[i]. After both passes, each slot holds prefix times suffix.

The two-array version (explicit prefix[] and suffix[] arrays, then multiply) is identical in spirit and easier to reason about first; the two-pass trick just folds them into the output array.`,
      pitfalls: [
        "Using division by the total product — it is explicitly forbidden and breaks when the array contains zeros.",
        "Forgetting to initialize the boundary products to 1 (nothing to the left of index 0, nothing to the right of the last index).",
        "Updating the running suffix BEFORE multiplying it into result[i] — order matters in the second pass.",
        "Two or more zeros in the input means every output is 0; the prefix/suffix method handles this automatically, division hacks do not."
      ],
      kotlin: `class Solution {
    fun productExceptSelf(nums: IntArray): IntArray {
        val n = nums.size
        val result = IntArray(n)

        result[0] = 1
        for (i in 1 until n) {
            result[i] = result[i - 1] * nums[i - 1]
        }

        var suffix = 1
        for (i in n - 1 downTo 0) {
            result[i] *= suffix
            suffix *= nums[i]
        }
        return result
    }
}`,
      complexity: "Time O(n) · Space O(1) extra (output excluded)"
    },
    {
      id: "valid-sudoku",
      title: "Valid Sudoku",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/valid-sudoku/",
      pattern: "HashSet",
      summary: "Given a partially filled 9x9 Sudoku board, return true if no digit repeats within any row, column, or 3x3 sub-box (empty cells are '.').",
      hints: [
        "You are really answering 27 independent 'no duplicates in this group' questions. What did you use in Contains Duplicate?",
        "Keep a HashSet per row, per column, and per 3x3 box; the box index for cell (r, c) is (r / 3) * 3 + c / 3."
      ],
      explanation: `Validity here means 27 separate no-duplicate constraints: 9 rows, 9 columns, 9 boxes. Each one is just Contains Duplicate in disguise, so hash sets are the natural tool.

Keep three arrays of 9 sets each: rows, cols, boxes. Scan every cell once; skip '.' cells. For a digit at (r, c), the box it belongs to is boxIndex = (r / 3) * 3 + c / 3 — integer division maps rows 0-2 to box row 0, 3-5 to box row 1, and so on. Try to add the digit to rows[r], cols[c], and boxes[boxIndex]; if any add reports the digit was already present, the board is invalid and you return false immediately. If the full scan completes, return true.

Note the problem asks only whether the current placements are consistent, not whether the puzzle is solvable — do not try to solve it. A common alternative encodes each constraint as a string like "5-in-row-3" in one big set; same idea, one set instead of 27.`,
      pitfalls: [
        "Getting the box index wrong — it is (r / 3) * 3 + c / 3 with integer division, not r % 3 or similar.",
        "Forgetting to skip '.' cells, which makes every board with two empty cells in a row 'invalid'.",
        "Validating only rows and columns and forgetting the nine 3x3 boxes.",
        "Trying to check solvability — the board only needs to be currently consistent."
      ],
      kotlin: `class Solution {
    fun isValidSudoku(board: Array<CharArray>): Boolean {
        val rows = Array(9) { HashSet<Char>() }
        val cols = Array(9) { HashSet<Char>() }
        val boxes = Array(9) { HashSet<Char>() }

        for (r in 0 until 9) {
            for (c in 0 until 9) {
                val cell = board[r][c]
                if (cell == '.') continue
                val boxIndex = (r / 3) * 3 + c / 3
                if (!rows[r].add(cell) || !cols[c].add(cell) || !boxes[boxIndex].add(cell)) {
                    return false
                }
            }
        }
        return true
    }
}`,
      complexity: "Time O(1) (81 cells) · Space O(1)"
    },
    {
      id: "longest-consecutive-sequence",
      title: "Longest Consecutive Sequence",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/longest-consecutive-sequence/",
      pattern: "HashSet",
      summary: "Given an unsorted integer array, return the length of the longest run of consecutive integers (values, not positions) in O(n) time.",
      hints: [
        "Sorting gives an easy O(n log n) answer, but the O(n) requirement rules it out. Which number in a consecutive run is special enough to start counting from?",
        "Put everything in a HashSet, and only start counting upward from numbers x where x - 1 is NOT in the set — those are the starts of runs."
      ],
      explanation: `Put all numbers in a HashSet so membership checks are O(1). The naive idea — for every number, count upward while the next value exists — is O(n^2) in the worst case because you recount the middle of long runs over and over.

The fix is to count only from the start of each run. A number x starts a run exactly when x - 1 is absent from the set. For such an x, walk upward (x + 1, x + 2, ...) while each value is present, measuring the run's length, and keep the maximum.

This is O(n) despite the nested loop: numbers in the middle of a run fail the x - 1 test instantly and cost O(1), and each element is visited by the inner walk exactly once — by the walk that started at its run's beginning. Total work is proportional to n, not n squared.

The set also deduplicates for free, which matters: duplicates neither extend runs nor should they inflate counts.`,
      pitfalls: [
        "Skipping the 'is x - 1 absent?' guard — counting up from every element degrades to O(n^2) and times out.",
        "Duplicates in the input must not break run counting; using a set handles this automatically.",
        "Empty input array should return 0, not crash.",
        "Values can be at Int extremes; walk with membership checks rather than precomputing x + length ranges carelessly."
      ],
      kotlin: `class Solution {
    fun longestConsecutive(nums: IntArray): Int {
        val numSet = nums.toHashSet()
        var longest = 0
        for (num in numSet) {
            if (numSet.contains(num - 1)) continue  // only start counting at run starts
            var current = num
            var length = 1
            while (numSet.contains(current + 1)) {
                current++
                length++
            }
            longest = maxOf(longest, length)
        }
        return longest
    }
}`,
      complexity: "Time O(n) · Space O(n)"
    }
  ]
});
