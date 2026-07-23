window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 4,
  title: "Linked Lists",
  goal: "Get fluent with pointer manipulation: reversal, fast/slow pointers, dummy heads, and combining structures (LRU).",
  patterns: ["Pointer Manipulation", "Fast & Slow Pointers", "Dummy Head", "HashMap + Doubly Linked List"],
  questions: [
    {
      id: "reverse-linked-list",
      title: "Reverse Linked List",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/reverse-linked-list/",
      pattern: "Pointer Manipulation",
      summary: "Given the head of a singly linked list, reverse the list and return the new head.",
      hints: [
        "You only need one pass. As you walk the list, think about what each node's next pointer should point to after the reversal.",
        "Keep three pointers: prev, curr, and a saved next. At each step redirect curr.next to prev, then shift all three forward."
      ],
      explanation: `The core idea is to walk the list once and flip each node's next pointer so it points backwards instead of forwards. Since a singly linked list only has forward pointers, the only trick is not losing the rest of the list while you flip.

Maintain two pointers: prev (initially null) and curr (initially head). On each iteration, first save curr.next into a temporary variable, then set curr.next = prev, then advance: prev = curr, curr = saved next. When curr becomes null you have walked off the end, and prev is the last real node you processed, which is the new head.

This is the canonical pointer-manipulation exercise: every harder list problem (reorder, reverse-in-groups, palindrome check) reuses this exact loop, so it should be muscle memory. The iterative version is O(n) time and O(1) space; the recursive version is elegant but costs O(n) stack space.`,
      pitfalls: [
        "Forgetting to save curr.next before overwriting it — you lose the rest of the list.",
        "Returning curr (which is null at the end) instead of prev.",
        "Not handling an empty list — the loop naturally handles it if prev starts at null."
      ],
      kotlin: `fun reverseList(head: ListNode?): ListNode? {
    var prev: ListNode? = null
    var curr = head
    while (curr != null) {
        val next = curr.next
        curr.next = prev
        prev = curr
        curr = next
    }
    return prev
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "merge-two-sorted-lists",
      title: "Merge Two Sorted Lists",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/merge-two-sorted-lists/",
      pattern: "Dummy Head",
      summary: "Given the heads of two sorted linked lists, merge them into one sorted list and return its head.",
      hints: [
        "You are building a new list one node at a time. What makes appending to the front of a list awkward, and how could a placeholder node fix that?",
        "Use a dummy head node so appending is uniform, keep a tail pointer, and at each step attach the smaller of the two current nodes."
      ],
      explanation: `This is the merge step of merge sort applied to linked lists. Both inputs are already sorted, so at any moment the next node of the answer is simply the smaller of the two current front nodes.

The annoying part is the very first node: without special handling you would need an if-branch to decide which list starts the result. The dummy-head pattern removes that: create a throwaway node, keep a tail pointer at the end of the built list, and always append to tail.next. At the end, return dummy.next.

Algorithm: while both lists are non-empty, compare the front values, link the smaller node onto tail, and advance that list and the tail. When one list runs out, link the entire remainder of the other list in one assignment (it is already sorted). No new nodes are allocated — you are just rewiring existing ones.`,
      pitfalls: [
        "Building the result without a dummy head and mishandling the first node.",
        "Forgetting to attach the leftover tail of the non-empty list after the loop.",
        "Returning dummy instead of dummy.next.",
        "Allocating new nodes instead of relinking the existing ones (works, but wastes memory)."
      ],
      kotlin: "fun mergeTwoLists(list1: ListNode?, list2: ListNode?): ListNode? {\n    val dummy = ListNode(0)\n    var tail = dummy\n    var a = list1\n    var b = list2\n    while (a != null && b != null) {\n        if (a.`val` <= b.`val`) {\n            tail.next = a\n            a = a.next\n        } else {\n            tail.next = b\n            b = b.next\n        }\n        tail = tail.next!!\n    }\n    tail.next = a ?: b\n    return dummy.next\n}",
      complexity: "Time O(n + m) · Space O(1)"
    },
    {
      id: "linked-list-cycle",
      title: "Linked List Cycle",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/linked-list-cycle/",
      pattern: "Fast & Slow Pointers",
      summary: "Given the head of a linked list, return true if the list contains a cycle and false otherwise.",
      hints: [
        "You could record every node you have seen, but can you detect a loop with O(1) extra memory? Think of two runners on a circular track.",
        "Use Floyd's tortoise-and-hare: move one pointer by 1 and another by 2; if there is a cycle they must eventually meet."
      ],
      explanation: `A cycle means that walking the list never reaches null. The obvious solution stores visited nodes in a HashSet and reports a cycle when a node repeats, but that costs O(n) space. Floyd's cycle detection does it in O(1).

Run two pointers from the head: slow moves one step per iteration, fast moves two. If the list ends (fast or fast.next hits null) there is no cycle. If there is a cycle, both pointers eventually enter it, and inside the cycle fast gains one position on slow per iteration, so the gap shrinks by exactly 1 each step — fast cannot jump over slow, it must land on it.

The loop condition is: while fast and fast.next are non-null, advance both pointers, then check slow === fast (reference equality, not value equality — values can repeat in a valid list). Start both at head and compare only after moving, otherwise they trivially match at the start.`,
      pitfalls: [
        "Comparing node values instead of node references — different nodes can hold equal values.",
        "Null-pointer errors from advancing fast two steps without checking fast.next first.",
        "Comparing slow and fast before moving them, which falsely reports a cycle on the first iteration."
      ],
      kotlin: `fun hasCycle(head: ListNode?): Boolean {
    var slow = head
    var fast = head
    while (fast?.next != null) {
        slow = slow?.next
        fast = fast.next?.next
        if (slow === fast) return true
    }
    return false
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "remove-nth-node-from-end-of-list",
      title: "Remove Nth Node From End of List",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
      pattern: "Two Pointers + Dummy Head",
      summary: "Given the head of a linked list and an integer n, remove the nth node from the end and return the head.",
      hints: [
        "Counting the length works but needs two passes. Could two pointers with a fixed distance between them find the target in one pass?",
        "Advance a fast pointer n steps first, then move fast and slow together until fast reaches the end; slow will sit just before the node to delete. A dummy head handles deleting the first node."
      ],
      explanation: `The one-pass trick is to keep two pointers exactly n nodes apart. When the leading pointer reaches the end of the list, the trailing pointer is exactly n nodes from the end — right where you need to be.

To delete a node you must stand on the node before it, and the node to delete might be the head itself (e.g. list of length n). Both issues are solved with a dummy node in front of head: start both pointers at the dummy, advance fast n steps, then move both one step at a time while fast.next is non-null. Now slow.next is the victim; bypass it with slow.next = slow.next.next.

Return dummy.next, not head — if the original head was removed, head is stale. The distance invariant is the whole algorithm; once you trust it, the code is five lines.`,
      pitfalls: [
        "Not using a dummy head, which breaks when the node to remove is the first node.",
        "Off-by-one in how far the fast pointer advances (n vs n+1 steps depending on where you start).",
        "Returning head instead of dummy.next after possibly removing the head."
      ],
      kotlin: `fun removeNthFromEnd(head: ListNode?, n: Int): ListNode? {
    val dummy = ListNode(0)
    dummy.next = head
    var fast: ListNode? = dummy
    var slow: ListNode? = dummy
    repeat(n) { fast = fast?.next }
    while (fast?.next != null) {
        fast = fast.next
        slow = slow?.next
    }
    slow?.next = slow?.next?.next
    return dummy.next
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "reorder-list",
      title: "Reorder List",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/reorder-list/",
      pattern: "Fast & Slow + Reverse + Merge",
      summary: "Given the head of a list L0 -> L1 -> ... -> Ln, reorder it in place to L0 -> Ln -> L1 -> Ln-1 -> ... without changing node values.",
      hints: [
        "The result alternates nodes from the front and the back of the list. What two sub-lists would you need so that a simple alternating merge produces it?",
        "Combine three primitives: find the middle with fast/slow pointers, reverse the second half, then interleave the two halves node by node."
      ],
      explanation: `The target order alternates between the front of the list and the back of the list. Walking backwards is impossible in a singly linked list, so the insight is: if you reverse the second half, its head becomes the last node of the original list, and the problem reduces to zipping two lists together.

The algorithm is three steps, each one a pattern you already know. Step 1: find the middle with fast/slow pointers (slow one step, fast two), then cut the list in two by setting slow.next = null after saving the second half. Step 2: reverse the second half with the standard prev/curr loop. Step 3: merge by alternation — take one node from the first half, one from the reversed half, repeat until the reversed half is exhausted.

The first half is always equal in length to or one longer than the reversed half, so driving the merge loop off the reversed half terminates cleanly and leaves the middle node (odd length) correctly at the end. Everything is pointer rewiring: no values are copied and no extra memory is used.`,
      pitfalls: [
        "Forgetting to cut the first half (slow.next = null), which creates a cycle during the merge.",
        "Losing next pointers during the interleave — save both nexts before rewiring.",
        "Mishandling short lists: length 0, 1, or 2 should be no-ops or trivial.",
        "Splitting at the wrong middle so the merge loop runs one node too far."
      ],
      kotlin: `fun reorderList(head: ListNode?): Unit {
    if (head?.next == null) return
    var slow = head
    var fast = head
    while (fast?.next?.next != null) {
        slow = slow?.next
        fast = fast.next?.next
    }
    var second = slow?.next
    slow?.next = null
    var prev: ListNode? = null
    while (second != null) {
        val next = second.next
        second.next = prev
        prev = second
        second = next
    }
    var first: ListNode? = head
    var rev = prev
    while (rev != null) {
        val firstNext = first?.next
        val revNext = rev.next
        first?.next = rev
        rev.next = firstNext
        first = firstNext
        rev = revNext
    }
}`,
      complexity: "Time O(n) · Space O(1)"
    },
    {
      id: "add-two-numbers",
      title: "Add Two Numbers",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/add-two-numbers/",
      pattern: "Dummy Head + Carry",
      summary: "Given two non-empty linked lists representing non-negative integers in reverse digit order, return their sum as a linked list in the same format.",
      hints: [
        "The digits are stored in reverse, which is exactly the order you add numbers by hand. What extra piece of state do you carry from one digit to the next?",
        "Walk both lists together, summing digit + digit + carry; build the result with a dummy head and keep looping while either list or the carry is non-zero."
      ],
      explanation: `Because the lists store digits least-significant first, you can add them exactly like grade-school addition: process column by column from the front, carrying overflow to the next column. No reversal or number conversion is needed — converting to Int/Long overflows on long inputs and misses the point.

Walk both lists in lockstep with a carry variable. At each step, sum = (digit from l1 or 0) + (digit from l2 or 0) + carry. The new digit is sum % 10 and the new carry is sum / 10. Append the digit to the result using the dummy-head pattern and advance whichever pointers are non-null.

The loop condition is the key detail: continue while l1 is non-null OR l2 is non-null OR carry is non-zero. This uniformly handles lists of different lengths (missing digits count as 0) and a final carry that adds an extra node, as in 5 + 5 = 10. Return dummy.next.`,
      pitfalls: [
        "Stopping when the lists end and dropping a final carry (e.g. 5 + 5 should produce [0, 1]).",
        "Assuming both lists have the same length instead of treating a missing digit as 0.",
        "Converting the lists to integers first — overflows for the allowed 100-digit inputs.",
        "Forgetting to advance the pointers with null-safe access when one list is already exhausted."
      ],
      kotlin: "fun addTwoNumbers(l1: ListNode?, l2: ListNode?): ListNode? {\n    val dummy = ListNode(0)\n    var tail = dummy\n    var a = l1\n    var b = l2\n    var carry = 0\n    while (a != null || b != null || carry != 0) {\n        val sum = (a?.`val` ?: 0) + (b?.`val` ?: 0) + carry\n        carry = sum / 10\n        tail.next = ListNode(sum % 10)\n        tail = tail.next!!\n        a = a?.next\n        b = b?.next\n    }\n    return dummy.next\n}",
      complexity: "Time O(max(n, m)) · Space O(max(n, m))"
    },
    {
      id: "lru-cache",
      title: "LRU Cache",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/lru-cache/",
      pattern: "HashMap + Doubly Linked List",
      summary: "Design a data structure with a fixed capacity supporting get(key) and put(key, value) in O(1), evicting the least recently used entry when full.",
      hints: [
        "You need O(1) lookup by key AND O(1) knowledge of which entry is oldest. No single standard structure gives both — which two would you combine?",
        "Pair a HashMap (key -> node) with a doubly linked list ordered by recency: move a node to the front on every access, evict from the back. Sentinel head/tail nodes remove all edge cases."
      ],
      explanation: `The requirements pull in two directions: get(key) in O(1) demands a hash map, but "least recently used" is an ordering, and hash maps have no order. The interview-standard answer is to combine a HashMap with a doubly linked list. The map stores key -> node for O(1) lookup; the list stores nodes in recency order, most recent at the front. The list must be doubly linked so a node can unlink itself in O(1) given only a pointer to it — a singly linked list would need a scan to find the predecessor.

Every operation reduces to two O(1) list primitives: remove(node) splices a node out, and insertAtFront(node) places it right after the head. Using sentinel head and tail nodes (dummies that are never real entries) means remove and insert never touch null and need no special cases for an empty list or the first/last element.

get: look the key up in the map; if absent return -1, otherwise unlink the node, re-insert it at the front (it is now the most recently used), and return its value. put: if the key exists, update the value and move the node to the front. If it is new and the cache is at capacity, evict tail.prev — the true LRU entry — removing it from both the list and the map, then create a node, insert it at the front, and record it in the map. The classic bug is forgetting one of the two structures during eviction.

In real Kotlin/Java code you would just use LinkedHashMap with accessOrder = true and override removeEldestEntry, but interviewers expect the hand-rolled version above.`,
      pitfalls: [
        "Evicting from the list but forgetting to remove the same key from the map (or vice versa).",
        "Forgetting that get must also move the node to the front — reads count as use.",
        "In put on an existing key, updating the value but not refreshing its recency.",
        "Storing the key in the node — without it you cannot delete the evicted entry from the map."
      ],
      kotlin: `class LRUCache(private val capacity: Int) {
    private class Node(val key: Int, var value: Int) {
        var prev: Node? = null
        var next: Node? = null
    }

    private val map = HashMap<Int, Node>()
    private val head = Node(0, 0)
    private val tail = Node(0, 0)

    init {
        head.next = tail
        tail.prev = head
    }

    private fun remove(node: Node) {
        node.prev?.next = node.next
        node.next?.prev = node.prev
    }

    private fun insertAtFront(node: Node) {
        node.next = head.next
        node.prev = head
        head.next?.prev = node
        head.next = node
    }

    fun get(key: Int): Int {
        val node = map[key] ?: return -1
        remove(node)
        insertAtFront(node)
        return node.value
    }

    fun put(key: Int, value: Int) {
        val existing = map[key]
        if (existing != null) {
            existing.value = value
            remove(existing)
            insertAtFront(existing)
            return
        }
        if (map.size == capacity) {
            val lru = tail.prev!!
            remove(lru)
            map.remove(lru.key)
        }
        val node = Node(key, value)
        map[key] = node
        insertAtFront(node)
    }
}`,
      complexity: "Time O(1) per op · Space O(capacity)"
    }
  ]
});
