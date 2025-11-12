# Concepts

This doc contains a conceptual overview of different concepts and features of the Open Agent Platform.

## Agent

An Agent is a custom assistant that is tied to a specific graph in a LangGraph deployment. An agent has a user provided name, description, and configurable fields.

The configurable fields tied to an Agent are what makes an Agent useful. This is a custom config object which contains fields that personalize the behavior of the agent (e.g. model, system prompt, tools, etc).
