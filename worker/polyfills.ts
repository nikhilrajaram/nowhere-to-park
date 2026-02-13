import { DOMParser as XDOMParser } from '@xmldom/xmldom';
// @ts-ignore
import { Element, Node } from '@xmldom/xmldom/lib/dom';

(globalThis as any).DOMParser = XDOMParser;
(globalThis as any).Node = Node;
(globalThis as any).Element = Element;
