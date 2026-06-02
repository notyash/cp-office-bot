# WhatsApp Chatbot — Police Commissioner's Office

A multilingual WhatsApp chatbot being developed for a Police Commissioner's Office, enabling citizens to interact with police services through a single WhatsApp number in their preferred language.

Currently in active development under client engagement.

---

## What It Does

Citizens can text in their preferred language and get routed to the right service automatically:

- **Freeform queries** — handled by an AI layer for natural language understanding
- **File a complaint** — structured, guided flow for submitting complaints
- **Locate a police station** — find the nearest station based on location
- **Find parking** — locate nearby available parking

Incoming messages are classified by a custom **intent router** that decides whether to hand off to the AI handler or a dedicated structured flow.

---

## Stack

Backend | TypeScript · Express.js |

Messaging | WhatsApp Business API |

AI | Planned integration for freeform query handling |

Sessions | Stateful in-memory session management for multi-turn conversations |

---

## Status

Active development. Core architecture (intent router, session management, structured flows) is being built. AI integration and full multilingual support are planned for subsequent phases.
