window.LC_LEARN = window.LC_LEARN || {};
window.LC_LEARN[4] = {
  sections: [
    {
      title: "Why Linked Lists At All",
      body: `A linked list trades random access for cheap structural surgery. If you are already holding a reference to a node, inserting or deleting right there is O(1): rewire one or two next pointers and you are done. An array-backed list must shift every element after the insertion point, which is O(n). The flip side: getting TO index i in a linked list is O(n) pointer-chasing, while an array does it in O(1) arithmetic. So the honest complexity of "insert at position i" is O(n) for both — the list only wins when the position is handed to you as a node reference (an iterator, the head, the tail).\n\nThe classic backend interview question — ArrayList vs LinkedList in Java — has a trap: in practice ArrayList wins almost everything, including many "LinkedList should win" workloads. The reason is cache locality. ArrayList stores its elements in one contiguous block, so iterating it streams through memory and the CPU prefetcher keeps the cache hot. LinkedList nodes are separate heap objects scattered across memory; every hop is a potential cache miss, plus each node costs extra memory for two pointers and object headers. Even ArrayList's O(n) shift is a memcpy of contiguous memory, which is brutally fast. Say this out loud in an interview and you signal you understand real hardware, not just Big-O.\n\nSo why do interviews love linked lists? Because they test pointer discipline: can you mutate a structure in place without losing pieces of it, and can you handle null edges cleanly? Recognize a linked-list problem by the ListNode class in the signature, and recognize the sub-pattern by the verb: "reverse" means the three-pointer dance, "cycle" or "middle" means fast and slow pointers, "merge" or "remove" means dummy head.`
    },
    {
      title: "The Dummy-Head Trick",
      body: `Any operation that might modify or remove the head forces an ugly special case: "if it is the head, reassign head; otherwise rewire prev.next". The dummy head kills that branch. Create one throwaway node, point its next at the real head, and now EVERY real node — including the old head — has a predecessor. Your loop logic becomes uniform, and at the end you return dummy.next, which is the correct new head no matter what happened to the old one.\n\nReach for it whenever you build a new list (merging two sorted lists, partitioning) or delete by value or position (remove elements, remove nth from end, delete duplicates). The cost is one allocation and zero asymptotic overhead. A common convention: keep a separate tail or prev pointer that walks forward while dummy stays parked at the front — dummy is the anchor you return from, not the pointer you move.`,
      kotlin: `fun removeElements(head: ListNode?, target: Int): ListNode? {
    val dummy = ListNode(0)
    dummy.next = head
    var prev: ListNode = dummy
    while (prev.next != null) {
        if (shouldRemove(prev.next!!, target)) {
            prev.next = prev.next!!.next   // unlink, prev stays put
        } else {
            prev = prev.next!!             // keep, advance
        }
    }
    return dummy.next
}`
    },
    {
      title: "Fast & Slow Pointers",
      body: `Two pointers moving at different speeds answer questions about a list's shape in O(n) time and O(1) space — no HashSet of visited nodes needed. The core idea: slow advances one step per iteration, fast advances two.\n\nCycle detection (Floyd): if there is a cycle, both pointers eventually enter it, and inside the cycle fast gains exactly one node on slow per iteration. The gap between them shrinks by one each step, so it must hit zero — they meet. If there is no cycle, fast simply falls off the end (hits null) and you return false. That "gains one per step" argument is why they cannot jump over each other and is worth stating in an interview. Finding the middle: when fast reaches the end, slow has covered half the distance, so slow IS the middle — this is step one of "reorder list" and "palindrome list". The n-behind trick for remove-nth-from-end: advance fast n steps first, then move both at the same speed; when fast hits the end, slow is exactly n behind — one pass, no length computation.\n\nRecognize the pattern from the words "cycle", "middle", "nth from the end", or any constraint demanding one pass with constant space. The loop guard is always some form of while (fast != null && fast.next != null) — get that condition wrong and you get an NPE on even-length lists.`,
      kotlin: `fun hasCycle(head: ListNode?): Boolean {
    var slow = head
    var fast = head
    while (fast?.next != null) {   // covers fast == null too
        slow = slow!!.next
        fast = fast.next!!.next
        if (slow === fast) return true   // identity, not equality
    }
    return false
}
// Middle: same loop without the check; slow ends at the middle.
// Nth-from-end: advance fast n times first, then move both in lockstep.`
    },
    {
      title: "In-Place Reversal: The Three-Pointer Dance",
      body: `Reversing a list in place means flipping every next pointer to face backwards, using O(1) extra space. You need three pointers: prev (the already-reversed portion, starts null), curr (the node being flipped), and next (a saved reference to the rest of the list). The order inside the loop is sacred: save next FIRST, then flip curr.next to prev, then slide prev and curr forward.\n\nThe classic bug is flipping before saving: the moment you write curr.next = prev without having stashed curr.next, the entire remainder of the list is unreachable — garbage collected, gone. If you only memorize one thing, memorize "save next first". When the loop ends, curr is null and prev holds the new head, so you return prev, not curr — the second most common bug.\n\nThis dance is a building block, not just a standalone problem: reverse-in-k-groups, reverse a sublist between positions m and n, and palindrome-check (reverse the second half after finding the middle) all embed it. Recognize it from "reverse" in the title or any solution that needs to walk a list backwards without a stack.`,
      kotlin: `fun reverseList(head: ListNode?): ListNode? {
    var prev: ListNode? = null
    var curr = head
    while (curr != null) {
        val next = curr.next   // 1. save the rest FIRST
        curr.next = prev       // 2. flip the pointer
        prev = curr            // 3. advance prev
        curr = next            // 4. advance curr
    }
    return prev   // curr is null here; prev is the new head
}`
    },
    {
      title: "Nullability in Kotlin Lists",
      body: `Every pointer in a linked-list problem is a ListNode? — the null at the end of the list and the null of "no node here" are the same thing, and Kotlin makes you acknowledge it at every dereference. This is the same discipline Java forces with explicit if (node != null) checks and NPEs when you forget; Kotlin just moves the check into the type system so forgetting becomes a compile error instead of a runtime crash.\n\nUse each operator deliberately. Safe-call chains collapse nested null checks: fast?.next?.next is null if any link is missing, which is exactly why while (fast?.next != null) is the idiomatic fast-pointer guard — it is Java's fast != null && fast.next != null in one expression. Inside that loop body you KNOW fast is non-null, but smart-casts do not survive across the loop condition for var properties, so a bare !! is legitimate there: fast = fast.next!!.next says "the guard just proved this". Use ?: (elvis) for defaults and early exits: val node = head ?: return null. The rule of thumb: ?. when null is a normal state you flow through, ?: when null means take a different path, !! only when a guard you can point at has already proven non-null.\n\nOne LeetCode-specific wart: val is a keyword in Kotlin, and LeetCode's ListNode names its value field val, so you must access it with backticks. Type it enough times that it stops looking weird.`,
      kotlin: "// LeetCode's node: 'val' is a keyword, so the field needs backticks\nclass ListNode(var `val`: Int) {\n    var next: ListNode? = null\n}\n\nfun middleValue(head: ListNode?): Int? {\n    var slow = head\n    var fast = head\n    while (fast?.next != null) {\n        slow = slow?.next\n        fast = fast.next?.next\n    }\n    return slow?.`val`          // null-safe read of the awkward field\n}"
    }
  ]
};
