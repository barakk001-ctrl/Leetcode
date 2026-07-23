window.LC_LEARN = window.LC_LEARN || {};
window.LC_LEARN[1] = {
  sections: [
    {
      title: "How HashMap Gives O(1)",
      body: `A HashMap is an array of buckets. When you put(key, value), the map calls key.hashCode(), compresses that int into a bucket index (roughly hash % capacity), and stores the entry there. Lookup repeats the same computation, so instead of scanning all n entries you jump straight to one bucket — that jump is the O(1). Two different keys can land in the same bucket (a collision); Java/Kotlin handle this by chaining entries in a linked list, and since Java 8 a bucket that grows past 8 entries converts to a red-black tree so the worst case degrades to O(log n) instead of O(n). The load factor (default 0.75) is the fill ratio that triggers resizing: when size exceeds capacity * 0.75, the map doubles its bucket array and rehashes everything, keeping chains short so average lookup stays constant.

The classic interview follow-up is the hashCode/equals contract: if a.equals(b) then a.hashCode() must equal b.hashCode(). The map first uses hashCode to pick the bucket, then equals to find the exact entry inside it. Break the contract — override equals but not hashCode — and two "equal" objects land in different buckets, so contains() returns false for a key you just inserted. Also never mutate a field that feeds hashCode while the object is a map key: the object now sits in the wrong bucket and is effectively lost. Kotlin data classes generate both methods consistently from the constructor properties, which is why they are safe map keys by default.`,
      kotlin: `// data class => consistent equals + hashCode, safe as a key
data class Point(val x: Int, val y: Int)

val seen = HashMap<Point, String>()
seen[Point(1, 2)] = "a"
println(seen.containsKey(Point(1, 2))) // true: same hash, equals matches

// Broken key: equals overridden, hashCode inherited from Any
class BadKey(val id: Int) {
    override fun equals(other: Any?) = other is BadKey && other.id == id
    // missing hashCode override => lookups silently fail
}`
    },
    {
      title: "HashSet — Have I Seen This Before?",
      body: `A HashSet is a HashMap where you only care about the keys. Same buckets, same O(1) add and contains, same hashCode/equals rules — it just drops the values. Reach for it whenever the only question is membership: does this element exist, have I encountered it already, is it in the allowed group.

Train the reflex: any time a brute-force solution says "for each element, scan the rest of the array to check if X exists", that inner scan is O(n) and a set makes it O(1), turning O(n^2) into O(n). Contains Duplicate is the purest form — walk the array, and if add() returns false you have seen the element before. Longest Consecutive Sequence is the sneakier form: dump everything into a set, then for each value check whether value minus 1 is present to decide if it starts a run. The set is buying you cheap existence checks that arrays cannot give you without sorting.`,
      kotlin: `// Contains Duplicate: add() returns false if already present
fun hasDuplicate(nums: IntArray): Boolean {
    val seen = HashSet<Int>()
    for (n in nums) {
        if (!seen.add(n)) return true
    }
    return false
}`
    },
    {
      title: "Frequency Maps — Counting as a Pattern",
      body: `A huge slice of easy/medium problems reduce to "count occurrences, then reason about the counts": majority element, first unique character, valid anagram, top-k frequent, ransom note. The pattern is always one O(n) pass building a Map of element to count, then a second pass (over the map or the input) answering the question. Two strings are anagrams exactly when their frequency maps are equal — that single fact solves the whole anagram family.

Group Anagrams adds one idea: to group items, map each item to a canonical key and let the map's values be the groups. For anagrams the key is either the sorted string ("eat" becomes "aet", O(k log k) per word) or a 26-slot count array joined into a string (O(k) per word — works because the alphabet is fixed). Whenever the alphabet is small and known — lowercase letters, digits — an IntArray(26) is a lighter frequency map than a HashMap: index by c minus 'a' and skip hashing entirely.`,
      kotlin: `val counts = HashMap<Char, Int>()
for (c in word) {
    counts[c] = counts.getOrDefault(c, 0) + 1
}

// getOrPut: handy when the value is a collection
val groups = HashMap<String, MutableList<String>>()
for (w in words) {
    val key = String(w.toCharArray().sortedArray())
    groups.getOrPut(key) { mutableListOf() }.add(w)
}

// or one-liner grouping
val grouped = words.groupBy { w -> String(w.toCharArray().sortedArray()) }`
    },
    {
      title: "Prefix / Suffix Accumulation",
      body: `If many queries ask about a running result over a range — sum, product, max — precompute it once. A prefix array where prefix[i] holds the accumulated result of elements 0..i-1 costs O(n) to build, and then any range query becomes O(1) arithmetic: sum of [l, r] is prefix[r+1] - prefix[l]. You are trading one linear pass up front for constant-time answers forever after. Range Sum Query is the textbook case; prefix sums also pair with a HashMap in Subarray Sum Equals K, where you ask "have I seen prefix - k before?" — the set reflex and the prefix idea composing.

Product of Array Except Self is the canonical interview example because division is banned. The trick: answer[i] is (product of everything left of i) times (product of everything right of i). Do one left-to-right pass writing prefix products into the answer array, then one right-to-left pass multiplying in a running suffix product. Two passes, O(n) time, O(1) extra space beyond the output. Recognize the shape whenever "except self", "to the left of", or repeated range queries appear.`,
      kotlin: `fun productExceptSelf(nums: IntArray): IntArray {
    val n = nums.size
    val ans = IntArray(n)
    var run = 1
    for (i in 0 until n) {        // prefix pass
        ans[i] = run
        run *= nums[i]
    }
    run = 1
    for (i in n - 1 downTo 0) {   // suffix pass
        ans[i] *= run
        run *= nums[i]
    }
    return ans
}`
    },
    {
      title: "Recognition Cheat-Sheet",
      body: `Interviews are pattern-matching under time pressure, so wire the phrasing directly to the tool. "Find a pair that sums to target" — HashMap of value to index, ask for target minus current (Two Sum). "Contains a duplicate" or "appears twice" — HashSet, check the return of add(). "Have these two the same letters" or anything anagram-shaped — frequency map or IntArray(26) comparison. "Group by ..." — HashMap with a canonical key and getOrPut into lists. "Count of ..." or "most/least frequent" — frequency map first, reason about counts second. "Range sum/product" or "except self" — prefix (and maybe suffix) accumulation. "Consecutive sequence without sorting" — set plus the "is value minus 1 present?" start-of-run check.

The meta-signal for the whole week: if your brute force contains an inner loop whose only job is to FIND something — a complement, a duplicate, a count — that loop is a hash lookup in disguise. Spend O(n) space, delete the inner loop, and the O(n^2) becomes O(n). Say that trade-off out loud in the interview; naming the space-for-time exchange is exactly what they are listening for.`
    }
  ]
};
