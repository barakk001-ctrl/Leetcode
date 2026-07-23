window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 5,
  title: "Trees",
  goal: "Recursion on binary trees: DFS traversals, BFS level order, and using BST ordering properties.",
  patterns: ["DFS / Recursion", "BFS / Level Order", "BST Properties"],
  questions: [
    {
      id: "invert-binary-tree",
      title: "Invert Binary Tree",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/invert-binary-tree/",
      pattern: "DFS",
      summary: "Given the root of a binary tree, swap the left and right children of every node and return the root of the inverted tree.",
      hints: [
        "What single local operation, if applied at every node, would produce the mirrored tree?",
        "Recurse: swap the two children of the current node, then invert each subtree the same way."
      ],
      explanation: `The mirror of a tree is the mirror of its subtrees, swapped. That is the whole insight: if you swap the left and right child of one node, and both subtrees are themselves already inverted, the whole tree rooted at that node is inverted. A problem that decomposes into the identical problem on both children is exactly what tree recursion (DFS) is for.

The algorithm: if the current node is null, return null (base case). Otherwise recursively invert the left subtree and the right subtree, then assign the inverted right subtree to node.left and the inverted left subtree to node.right. Return the node.

The order does not actually matter here — you can swap the children first and then recurse, or recurse first and then swap. Each node is visited once, so the runtime is linear, and the only extra space is the recursion stack, which is as deep as the tree height.`,
      pitfalls: [
        "Forgetting the null base case — the recursion must stop at empty children.",
        "Swapping with an intermediate variable incorrectly and overwriting one child before saving it.",
        "Only swapping at the root instead of at every node."
      ],
      kotlin: `class Solution {
    fun invertTree(root: TreeNode?): TreeNode? {
        if (root == null) return null
        val invertedLeft = invertTree(root.left)
        root.left = invertTree(root.right)
        root.right = invertedLeft
        return root
    }
}`,
      complexity: "Time O(n) · Space O(h)"
    },
    {
      id: "maximum-depth-of-binary-tree",
      title: "Maximum Depth of Binary Tree",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
      pattern: "DFS",
      summary: "Given the root of a binary tree, return the number of nodes along the longest path from the root down to the farthest leaf.",
      hints: [
        "How does the depth of a tree relate to the depths of its two subtrees?",
        "Recursion: the answer at a node is 1 plus the maximum of the answers for its left and right children; an empty tree has depth 0."
      ],
      explanation: `The depth of a tree is defined in terms of its subtrees: the longest root-to-leaf path must go through either the left or the right child, so the depth at a node is one (for the node itself) plus the larger of the two subtree depths. This self-similar definition maps directly onto recursion.

The algorithm: if the node is null, return 0 — an empty tree contributes no depth. Otherwise compute maxDepth(left) and maxDepth(right) and return 1 + max of the two. That is the entire solution.

This is the canonical "reduce a tree question to answers from the children" template. Almost every tree problem in this week follows the same skeleton: handle null, get results from children, combine. Time is O(n) since every node is visited once; space is O(h) for the recursion stack (h = tree height, up to n for a skewed tree).`,
      pitfalls: [
        "Returning 1 instead of 0 for a null node, which overcounts by one.",
        "Confusing depth counted in nodes (this problem) with depth counted in edges.",
        "Trying to track depth with an external counter instead of returning it up the recursion."
      ],
      kotlin: `class Solution {
    fun maxDepth(root: TreeNode?): Int {
        if (root == null) return 0
        return 1 + maxOf(maxDepth(root.left), maxDepth(root.right))
    }
}`,
      complexity: "Time O(n) · Space O(h)"
    },
    {
      id: "same-tree",
      title: "Same Tree",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/same-tree/",
      pattern: "DFS",
      summary: "Given the roots of two binary trees p and q, return true if the trees are structurally identical and every corresponding node has the same value.",
      hints: [
        "Walk both trees at the same time — when are two trees definitely equal, and when can you stop early?",
        "Recurse in lockstep: two trees are the same iff the roots match and the left subtrees are the same and the right subtrees are the same."
      ],
      explanation: `Two trees are identical exactly when their roots hold equal values and their left subtrees are identical and their right subtrees are identical. That recursive definition is the algorithm — you traverse both trees simultaneously, comparing corresponding nodes.

The base cases carry most of the logic. If both nodes are null, the (empty) trees match: return true. If exactly one is null, the structures differ: return false. If both exist but the values differ: return false. Only then do you recurse on the pairs (p.left, q.left) and (p.right, q.right), combining with logical AND so that any mismatch short-circuits the rest of the traversal.

This "compare two trees in lockstep" helper is worth memorizing verbatim: it is reused as-is inside Subtree of Another Tree, and the same shape (with children crossed) solves Symmetric Tree. Time is O(min(n, m)) since traversal stops at the first mismatch; space is the recursion depth.`,
      pitfalls: [
        "Handling only the both-null case and dereferencing a null on the one-null case.",
        "Comparing node references with == on the objects instead of comparing values.",
        "Checking values but forgetting to require the same structure (shape) as well."
      ],
      kotlin: "class Solution {\n    fun isSameTree(p: TreeNode?, q: TreeNode?): Boolean {\n        if (p == null && q == null) return true\n        if (p == null || q == null || p.`val` != q.`val`) return false\n        return isSameTree(p.left, q.left) && isSameTree(p.right, q.right)\n    }\n}",
      complexity: "Time O(min(n, m)) · Space O(h)"
    },
    {
      id: "subtree-of-another-tree",
      title: "Subtree of Another Tree",
      difficulty: "Easy",
      url: "https://leetcode.com/problems/subtree-of-another-tree/",
      pattern: "DFS",
      summary: "Given the roots of trees root and subRoot, return true if root contains a subtree that is identical (structure and values) to subRoot.",
      hints: [
        "You already know how to check whether two trees are exactly equal — how could you reuse that here?",
        "For every node in root, run a same-tree check against subRoot; return true if any node passes."
      ],
      explanation: `This problem is two smaller problems glued together. Problem one: are two trees identical? That is exactly Same Tree, solved above. Problem two: does any node of root serve as the root of such an identical tree? So the solution is a DFS over root where, at each node, you invoke the same-tree comparison against subRoot.

The outer recursion: if root is null, subRoot cannot appear in it, so return false (LeetCode guarantees subRoot is non-null). Otherwise, if isSameTree(root, subRoot) returns true, you are done. Otherwise the match, if it exists, is entirely inside one of the children, so return isSubtree(root.left, subRoot) OR isSubtree(root.right, subRoot).

Note the subtlety: a matching subtree must extend all the way down — it is not enough for subRoot to appear as a "prefix" of some subtree. The same-tree check enforces this automatically because it requires nulls to line up. Worst-case time is O(n * m) (an equality check from every node); space is the recursion depth.`,
      pitfalls: [
        "Recursing into root's children with isSameTree instead of isSubtree after a partial match fails.",
        "Treating a value-only match as success — structure below must match too, including nulls.",
        "Assuming a matching root value means the match must happen there; duplicates require trying deeper nodes as well."
      ],
      kotlin: "class Solution {\n    fun isSubtree(root: TreeNode?, subRoot: TreeNode?): Boolean {\n        if (root == null) return false\n        if (isSameTree(root, subRoot)) return true\n        return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot)\n    }\n\n    private fun isSameTree(p: TreeNode?, q: TreeNode?): Boolean {\n        if (p == null && q == null) return true\n        if (p == null || q == null || p.`val` != q.`val`) return false\n        return isSameTree(p.left, q.left) && isSameTree(p.right, q.right)\n    }\n}",
      complexity: "Time O(n · m) · Space O(h)"
    },
    {
      id: "binary-tree-level-order-traversal",
      title: "Binary Tree Level Order Traversal",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
      pattern: "BFS",
      summary: "Given the root of a binary tree, return its nodes' values grouped by level, from the root level down, left to right within each level.",
      hints: [
        "The output is organized by distance from the root — which traversal visits nodes in that order?",
        "Use BFS with a queue, and snapshot the queue's size at the start of each round so you know exactly how many nodes belong to the current level."
      ],
      explanation: `Grouping nodes by their distance from the root is the defining behavior of breadth-first search. A queue processes nodes in the order they were discovered, so all nodes of depth d are dequeued before any node of depth d+1.

The one trick that turns plain BFS into level-order output is the level-size snapshot. At the start of each outer loop iteration, the queue contains exactly the nodes of the current level. Record levelSize = queue.size, then dequeue exactly that many nodes into a fresh list, enqueueing each node's non-null children as you go. Those children form the next level and will be counted in the next snapshot. Append the list to the result after the inner loop.

Algorithm: return an empty list if root is null; otherwise seed the queue with root and repeat the snapshot loop until the queue is empty. Every node is enqueued and dequeued once, so time is O(n). The queue holds at most one level at a time — up to about n/2 nodes for the bottom of a complete tree — so space is O(n). This size-snapshot pattern also solves right-side view, zigzag traversal, and level averages with only small changes.`,
      pitfalls: [
        "Reading queue.size inside the inner loop condition — it changes as you enqueue children; snapshot it first.",
        "Not handling a null root, which yields [[null]] or a crash instead of [].",
        "Enqueueing null children and then dereferencing them on dequeue."
      ],
      kotlin: "class Solution {\n    fun levelOrder(root: TreeNode?): List<List<Int>> {\n        val result = mutableListOf<List<Int>>()\n        if (root == null) return result\n        val queue = ArrayDeque<TreeNode>()\n        queue.add(root)\n        while (queue.isNotEmpty()) {\n            val levelSize = queue.size\n            val level = mutableListOf<Int>()\n            repeat(levelSize) {\n                val node = queue.removeFirst()\n                level.add(node.`val`)\n                node.left?.let { queue.add(it) }\n                node.right?.let { queue.add(it) }\n            }\n            result.add(level)\n        }\n        return result\n    }\n}",
      complexity: "Time O(n) · Space O(n)"
    },
    {
      id: "lowest-common-ancestor-of-a-binary-search-tree",
      title: "Lowest Common Ancestor of a Binary Search Tree",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
      pattern: "BST Property",
      summary: "Given a BST and two of its nodes p and q, return their lowest common ancestor — the deepest node that has both p and q as descendants (a node may be its own descendant).",
      hints: [
        "This is a BST, not a general tree — what does a node's value tell you about where p and q live relative to it?",
        "Walk down from the root: if both values are smaller than the current node go left, if both are larger go right; the first node where they split is the answer."
      ],
      explanation: `In a general binary tree, finding the LCA requires exploring both subtrees. In a BST you get the answer by comparing values: every node's value tells you exactly which side each target is on. If both p and q are less than the current node, their whole shared history lies in the left subtree; if both are greater, in the right subtree. The first node where that stops being true — p and q fall on different sides, or the current node equals one of them — is the split point, and the split point is the lowest common ancestor.

Why is the split point the LCA? It is an ancestor of both (you reached it on the unique root-to-node path of each target), and no deeper node can be: moving one level further down commits to one side and abandons the other target.

The algorithm needs no recursion at all. Start at the root and loop: if p and q are both smaller, step left; if both larger, step right; otherwise return the current node. Since LeetCode guarantees both nodes exist in the tree, the loop always terminates at the answer. Time is O(h) — one path from the root — and iterative traversal makes the space O(1), a strict improvement over the general-tree O(n) solution.`,
      pitfalls: [
        "Forgetting that a node counts as its own ancestor — when the current node equals p or q, that is the answer.",
        "Using strict inequalities carelessly so the equality case falls into the wrong branch.",
        "Running a general-tree O(n) LCA and never exploiting the BST ordering the problem gives you."
      ],
      kotlin: "class Solution {\n    fun lowestCommonAncestor(root: TreeNode?, p: TreeNode?, q: TreeNode?): TreeNode? {\n        val pVal = p!!.`val`\n        val qVal = q!!.`val`\n        var node = root\n        while (node != null) {\n            node = when {\n                pVal < node.`val` && qVal < node.`val` -> node.left\n                pVal > node.`val` && qVal > node.`val` -> node.right\n                else -> return node\n            }\n        }\n        return null\n    }\n}",
      complexity: "Time O(h) · Space O(1)"
    },
    {
      id: "validate-binary-search-tree",
      title: "Validate Binary Search Tree",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/validate-binary-search-tree/",
      pattern: "BST Property",
      summary: "Given the root of a binary tree, return true if it is a valid binary search tree: every node's left subtree contains only smaller values and its right subtree only larger values.",
      hints: [
        "Comparing each node only to its direct children is not enough — a node deep in the left subtree must still be smaller than the root. What constraint does each ancestor pass down?",
        "DFS carrying an allowed (min, max) range for each node; going left tightens the upper bound to the parent's value, going right tightens the lower bound."
      ],
      explanation: `The classic wrong solution checks each node against its immediate children. That misses violations like a 6 sitting in the left subtree's right child under a root of 5: locally fine (6 > its parent 3), globally invalid (6 > root 5 but it is in the root's left subtree). The BST property is a constraint from ALL ancestors, not just the parent.

The fix is to carry that accumulated constraint down the recursion as an open interval (min, max) of values the current node is allowed to hold. The root can be anything. When you descend left, the parent's value becomes the new upper bound; when you descend right, it becomes the new lower bound. A node is valid if min < node.val < max, strictly — equal values are not allowed.

Algorithm: validate(node, min, max) returns true for null; returns false if node.val is outside the open interval; otherwise returns validate(left, min, node.val) AND validate(right, node.val, max). Since node values can be exactly Int.MIN_VALUE or Int.MAX_VALUE, use Long bounds (or nullable bounds) so the initial interval genuinely means "unbounded". An equivalent alternative: do an inorder traversal and verify the visited values are strictly increasing. Time O(n), space O(h).`,
      pitfalls: [
        "Comparing only parent vs. children instead of enforcing the full ancestor range.",
        "Using Int.MIN_VALUE/Int.MAX_VALUE as initial bounds — a node holding exactly those values is wrongly rejected; use Long or nullable bounds.",
        "Allowing equal values: duplicates make the tree invalid, so comparisons must be strict.",
        "In the inorder variant, comparing to the wrong previous value or forgetting to update it."
      ],
      kotlin: "class Solution {\n    fun isValidBST(root: TreeNode?): Boolean = validate(root, Long.MIN_VALUE, Long.MAX_VALUE)\n\n    private fun validate(node: TreeNode?, min: Long, max: Long): Boolean {\n        if (node == null) return true\n        val value = node.`val`.toLong()\n        if (value <= min || value >= max) return false\n        return validate(node.left, min, value) && validate(node.right, value, max)\n    }\n}",
      complexity: "Time O(n) · Space O(h)"
    },
    {
      id: "kth-smallest-element-in-a-bst",
      title: "Kth Smallest Element in a BST",
      difficulty: "Medium",
      url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",
      pattern: "BST Property",
      summary: "Given the root of a BST and an integer k, return the k-th smallest value (1-indexed) among all node values in the tree.",
      hints: [
        "Which traversal of a BST visits the values in sorted order?",
        "Run an inorder traversal (left, node, right) and stop as soon as you have visited k nodes — an explicit stack makes early stopping easy."
      ],
      explanation: `The key BST fact: an inorder traversal (left subtree, node, right subtree) visits values in strictly increasing order. So the k-th smallest element is simply the k-th node an inorder traversal touches. No sorting, no collecting all values — just traverse and count.

You could recurse and decrement a counter, but early termination is cleaner with an explicit stack. The iterative inorder template: starting from the current node, push nodes while walking as far left as possible; then pop — the popped node is the next value in sorted order; then move to the popped node's right child and repeat.

Algorithm: push the leftmost spine of the tree, pop a node, decrement k; if k hits zero, return that node's value immediately; otherwise continue the traversal from its right child. Each node is pushed and popped at most once, so time is O(h + k) — you walk down to the smallest element (h steps) and then advance k times. Space is O(h) for the stack. This iterative inorder template is worth knowing on its own: it also powers BST Iterator and inorder-based validation.`,
      pitfalls: [
        "Doing a full traversal into a list and indexing it — correct but wastes O(n) time and space when k is small.",
        "Off-by-one on k: it is 1-indexed, so return when the counter reaches zero after decrementing.",
        "Forgetting to move to node.right after popping, which loses the right subtrees entirely.",
        "In a recursive version, failing to short-circuit once the answer is found."
      ],
      kotlin: "class Solution {\n    fun kthSmallest(root: TreeNode?, k: Int): Int {\n        val stack = ArrayDeque<TreeNode>()\n        var node = root\n        var remaining = k\n        while (true) {\n            while (node != null) {\n                stack.addLast(node)\n                node = node.left\n            }\n            val current = stack.removeLast()\n            remaining--\n            if (remaining == 0) return current.`val`\n            node = current.right\n        }\n    }\n}",
      complexity: "Time O(h + k) · Space O(h)"
    }
  ]
});
