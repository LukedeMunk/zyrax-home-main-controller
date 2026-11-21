# AGENTS_PYTHON.md

**Version 1.1**

## Purpose

This document defines the required structure and comment style for Python code. v1.1

Agents must prioritize:

- Consistent file and code organization.
- Clear and meaningful names.
- Readable control flow.
- Focused functions and classes.
- Uniform function comment headers.
- Small changes that preserve the style of existing code.

Inspect the surrounding code before making changes. Follow established patterns when they do not conflict with this document or `PYTHON_CONVENTIONS.md`.

## Sources of truth

Use the following precedence when instructions conflict:

1. The explicit task requirements.
2. The nearest applicable `AGENTS_PYTHON.md`.
3. `PYTHON_CONVENTIONS.md`.
4. Existing patterns in the affected file or module.
5. General Python conventions.

Do not perform large-scale formatting or renaming merely to make existing code match these conventions.

## File structure

Use the following order in every Python file:

1. File comment header.
2. Imports.
3. Constants.
4. Global variables.
5. Classes.
6. Other functions.
7. Entry-point code, when applicable.

Use this file comment header structure:

```python
################################################################################
#
# File:     example.py
# Version:  X.X.X
# Author:   Author name
#
# Brief:    Short description of the file.
#
#           More information:
#           https://github.com/LukedeMunk/[repository]
#
################################################################################
```

Keep related definitions together. Separate imports, constants, global variables, classes, and functions with blank lines. Use clearly named region comments only when they make a large file easier to navigate.

## Imports

Organize imports in the following groups:

1. Standard-library imports.
2. Third-party imports.
3. Local imports.

Separate import groups with one blank line.

Prefer explicit imports. Do not use wildcard imports unless an existing interface deliberately requires them. Keep imports at module level unless a local import is necessary to prevent a circular dependency or defer an optional dependency.

## Naming conventions

Use the naming conventions defined in `PYTHON_CONVENTIONS.md`:

- Use `PascalCase` for class names.
- Use `snake_case` for functions and methods.
- Use `snake_case` for arguments and variables.
- Use `MACRO_CASE` for constants.
- Prefix private functions and methods with a single underscore.
- Use meaningful names and avoid uncommon abbreviations.
- Do not use Hungarian notation or other type prefixes.
- Prefer nouns or noun phrases for class names.
- Prefer verbs or verb phrases for functions and methods that perform actions.
- Prefix boolean identifiers with `is`, `has`, `can`, `should`, `any`, or another clear predicate.

Preserve established public names unless changing them is part of the task.

## Formatting

- Use four spaces for indentation.
- Do not use tabs for indentation.
- Add spaces around operators and after commas.
- Leave one blank line between methods.
- Leave two blank lines between top-level classes and functions.
- Do not leave trailing whitespace.
- Do not place multiple statements on one line.
- Use parentheses for multiline expressions instead of backslash continuation.

Prefer wide lines and avoid unnecessary line breaks. Keep function calls, function definitions, `if` statements, collection literals, and other constructs on a single line when they do not exceed 100 characters.

When a construct exceeds 100 characters, break it at a natural boundary such as after a comma or before an operator. Indent continuation lines consistently and keep the structure easy to scan.

```python
# Correct
if is_enabled and device.is_available() and device.has_capability(required_capability):
    device.execute(command)

# Avoid unnecessary wrapping
if (
    is_enabled
    and device.is_available()
    and device.has_capability(required_capability)
):
    device.execute(command)
```

Do not make a line harder to understand merely to keep it below the limit. Long URLs, generated values, or identifiers that cannot be split clearly may exceed 100 characters.

## Blank lines and vertical spacing

Use blank lines to expose structure and changes of responsibility. A non-trivial function should not
be one uninterrupted wall of statements, but closely related statements must remain grouped.

- Use two blank lines between top-level classes, functions, and their attached comment headers.
- Use one blank line between methods inside a class. The required function comment header belongs to
  its method and starts after that single blank line.
- Use one blank line between module-level import groups, constants, global state, classes, functions,
  and entry-point code.
- Inside a non-trivial function or method, use one blank line between distinct phases such as input
  validation, data preparation, external calls, state mutation, and result construction.
- Keep directly related statements together without blank lines. Examples include assignments that
  initialize one object, consecutive transformations of the same value, and a short sequence that
  performs one operation.
- Keep consecutive guard clauses together when they form one validation phase. Add one blank line
  after that phase before the normal execution path.
- Add one blank line before a final `return` when it follows a multi-statement calculation, mutation,
  or orchestration phase. Do not add it to a single-statement function, short guard clause, or compact
  branch.
- Do not place a blank line at the start or end of a function, method, class, loop, conditional, or
  context-manager body.
- Do not separate a decorator from the declaration it decorates or a required comment header from its
  decorators and declaration.
- Do not insert blank lines between every argument, collection item, dictionary entry, assignment, or
  line of one cohesive operation.
- Use no more than two consecutive blank lines at module level and no more than one inside a class or
  function.
- Blank lines must be empty and contain no spaces or tabs.

Use this cadence for a function with validation, preparation, mutation, and a result:

```python
def update_device(configuration):
    if configuration is None:
        return None
    if "id" not in configuration:
        raise ValueError("A device ID is required.")

    device = load_device(configuration["id"])
    values = normalize_values(configuration.get("values", {}))

    device.update(values)
    save_device(device)

    return device
```

Avoid both extremes:

```python
# Too dense: validation, preparation, mutation, and return have no visual boundaries.
if configuration is None:
    return None
device = load_device(configuration["id"])
values = normalize_values(configuration.get("values", {}))
device.update(values)
save_device(device)
return device

# Too sparse: every statement is separated even though the assignments form one operation.
device.name = name

device.room_id = room_id

device.is_enabled = is_enabled
```

## Function structure

Keep functions focused on one responsibility.

- Validate input before performing the main operation.
- Prefer early returns when they reduce nesting.
- Keep the normal execution path easy to follow.
- Avoid hidden changes to global state.
- Avoid mutable default arguments.
- Return consistent types across all execution paths.
- Extract a helper function when a block has a separate responsibility or a meaningful reusable name.
- Do not split a short, cohesive function into unnecessary helpers.

Place decorators immediately above the function declaration. The required function comment header belongs above the decorators.

## Required function comment headers

Use the project's function comment header structure above every function and method, including:

- Module-level functions.
- Public methods.
- Private methods.
- Constructors and special methods.
- Static methods and class methods.
- Async functions.
- Nested functions.
- Test functions and test methods.

Use this structure for a function with parameters and a return value:

```python
################################################################################
#
#   @brief    Looks for a character in the specified keyword.
#   @param    keyword             String to search
#   @param    character           Character to find
#   @return   int                 Index of the character, or -1 when not found
#
################################################################################
def look_for_character(keyword, character):
    return keyword.find(character)
```

Indent the complete header to the same level as a method:

```python
class DeviceManager:
    ################################################################################
    #
    #   @brief    Initializes the class.
    #
    ################################################################################
    def __init__(self):
        self.devices = []
```

Place the header above decorators:

```python
class ValueValidator:
    ################################################################################
    #
    #   @brief    Returns whether the specified value is valid.
    #   @param    value               Value to validate
    #   @return   bool                True when the value is valid
    #
    ################################################################################
    @staticmethod
    def is_valid(value):
        return value is not None
```

Apply these header rules:

- Start with a separator line made from `#` characters.
- Leave a commented blank line after the opening separator and before the closing separator.
- Use `@brief` to describe the function's purpose in one concise sentence.
- Use one `@param` line for each explicit parameter, in the same order as the function signature.
- Do not add `@param` entries for `self` or `cls`.
- Use `@return` when the function returns a meaningful value.
- Omit `@return` when the function only returns `None`.
- State the returned type after `@return` when it is useful and known.
- Align parameter descriptions consistently with the surrounding code.
- Update the header whenever the function signature, return value, or responsibility changes.

Do not replace the required comment header with only a docstring. A docstring may be added when it provides useful runtime documentation, but it does not replace the header.

## Class structure

Use classes to group state and behavior that belong together.

Organize class members in this order when practical:

1. Class constants.
2. Constructor.
3. Public properties.
4. Public methods.
5. Private methods.
6. Special methods not already placed according to their purpose.

Keep initialization explicit. Do not perform unrelated or surprising work in a constructor. Keep instance state on `self` and class-wide state on the class.

Avoid classes that only contain unrelated utility methods. Use focused module-level functions when no shared state or class responsibility exists.

## Control flow

- Prefer clear `if`, `elif`, and `else` blocks over dense conditional expressions.
- Prefer early returns over deeply nested blocks.
- Keep conditions positive and readable when practical.
- Give complex conditions a meaningful variable or helper function name.
- Use `for` loops when iterating over a collection.
- Use `while` loops only when their termination condition is clear.
- Avoid unbounded loops unless they are an explicit and controlled part of the program.
- Do not use exceptions as normal control flow.

Minimize inline `if` expressions. Use them only when the complete expression remains immediately understandable.

## Comments

Comments must explain intent, constraints, assumptions, or non-obvious behavior. Do not comment syntax that is already clear from the code.

- Write comments in clear sentences or concise phrases.
- Keep comment terminology consistent with the code.
- Place a comment directly above the code it describes when possible.
- Use an end-of-line comment only when it remains readable and fits within 100 characters.
- Add a space after `#` in ordinary comments.
- Keep comments accurate when behavior changes.
- Remove obsolete commented-out code instead of preserving it without a clear reason.
- Use `TODO` comments only when they describe a concrete remaining action.

Function comment headers are mandatory even when the function is simple. Ordinary comments inside the function are only necessary when they add information that the code itself does not express clearly.

## Constants and global variables

Define constants before global variables and use `MACRO_CASE` names.

- Prefer constants over repeated magic values.
- Keep constants close to the module that owns their meaning.
- Avoid mutable global state.
- Do not use a global variable when the value can be passed explicitly or stored on the responsible object.
- When global state is necessary, give it a clear name and keep its mutation localized.

## Change discipline

Agents must:

- Inspect the surrounding module and related declarations before editing.
- Make the smallest coherent change that satisfies the task.
- Follow the existing structure of the affected file where it does not conflict with these rules.
- Add the required function comment header to every new function.
- Update the comment header of every modified function when its documented behavior changes.
- Avoid unrelated formatting, renaming, and cleanup.
- Preserve existing public interfaces unless changing them is required.
- Preserve unrelated user changes in the working tree.

## Completion checklist

Before considering a Python code change complete, confirm that:

- The file follows the required layout.
- Names follow the applicable naming conventions.
- Indentation uses four spaces and no tabs.
- Constructs remain on one line when readable and no longer than 100 characters.
- Longer constructs are wrapped at natural boundaries.
- Blank lines separate logical phases without splitting cohesive operations; top-level definitions use
  two blank lines and class or function bodies use at most one consecutive blank line.
- Every new or modified function has the required comment header.
- Function headers accurately describe parameters and return values.
- Classes and functions each have a focused responsibility.
- Control flow is clear and avoids unnecessary nesting.
- Comments explain intent rather than obvious syntax.
- No unrelated code was reformatted or renamed.
