import type { Token } from "./tokens";
import { TokenType } from "./tokens";
import { die } from "./die";

enum ExpressionType {
    BINARY = "BINARY",
    UNARY = "UNARY",
    LITERAL = "LITERAL",
    GROUPING = "GROUPING",
}

class AstNode {
    value: Token;
    children: AstNode[];
    parent: AstNode;
    constructor(value: Token, parent: AstNode = null, children: AstNode[] = []) {
        this.value = value;
        this.parent = parent;
        this.children = children;
    }
    findRoot(): AstNode {
        let root: AstNode = this;
        while (root.parent) {
            root = root.parent;
        }
        return root;
    }
    print() {
        console.log(this.value);
        if (!this.children) return;
        this.children.forEach((c) => c.print());
    }
    pushChild(child?: AstNode) {
        if (child) {
            this.children.push(child);
        }
    }
}

export function parse(tokens: Token[], root: AstNode = null): AstNode {
    if (!tokens.length) return null;
    if (isLiteral(tokens[0].type)) {
        if (!root) {
            root = new AstNode(tokens[0], root);
        } else {
            root.pushChild(new AstNode(tokens[0], root));
        }
        return parse(tokens.slice(1), root);
    } else if (isBinaryOperator(tokens[0].type)) {
        root.parent = new AstNode(tokens[0], null, [root]);
        root.parent.pushChild(parse([tokens[1]], root.parent));
        return parse(tokens.slice(2), root.parent);
    } else if (tokens[0].type === "EOF") {
        return root;
    } else {
        die("parser", "unknown token", tokens[0].line);
    }
}

function isLiteral(type: TokenType) {
    switch (type) {
        case TokenType.NUMBER:
        case TokenType.STRING:
        case TokenType.TRUE:
        case TokenType.FALSE:
        case TokenType.NIL:
            return true;
        default:
            return false;
    }
}
function isBinaryOperator(type: TokenType) {
    switch (type) {
        case TokenType.EQUAL_EQUAL:
        case TokenType.BANG_EQUAL:
        case TokenType.PLUS:
            // case TokenType.:
            // case TokenType.:
            // case TokenType.:
            // case TokenType.:
            // case TokenType.:
            // case TokenType.:
            // case TokenType.:
            // case TokenType.:
            return true;
        default:
            return false;
    }
}
