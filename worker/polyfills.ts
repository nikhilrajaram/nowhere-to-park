import { DOMParser as XDOMParser } from '@xmldom/xmldom';
// @ts-ignore
import { Element, Node } from '@xmldom/xmldom/lib/dom';

globalThis.DOMParser = XDOMParser;
globalThis.Node = Node;
globalThis.Element = Element;
