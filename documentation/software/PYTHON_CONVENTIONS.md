# Python Coding Conventions

This document secures the code quality of Python modules by describing the coding conventions.

> When the code doesn't fulfill the guidelines, the code cannot be integrated in the project.

## Naming conventions

| Object Name               | Notation   | Length | Prefix | Suffix | Char Mask   | Example            |
|---------------------------|------------|-------:|--------|--------|-------------|--------------------|
| Class name                | PascalCase |     50 | No     | No     | [A-z][0-9]  | `UserAccount`      |
| Method name               | snake_case |     50 | No     | No     | _[a-z][0-9] | `do_this`          |
| Method arguments          | snake_case |     50 | No     | No     | _[a-z][0-9] | `is_done`          |
| Variables                 | snake_case |     50 | No     | No     | _[a-z][0-9] | `user_index`       |
| Constants name            | MACRO_CASE |     50 | No     | No     | _[A-Z][0-9] | `MINIMUM_AGE`      |
| Private methods           | snake_case |     50 | `_`    | No     | _[a-z][0-9] | `_private_method`  |

## File layout

> Use this layout for every Python and header file.

1. File header:

```python
################################################################################
#
# File:     [name_of_file].py
# Version:  [X].[X].[X]
# Author:   [author]
#
# Brief:    Description. More information:
#           https://github.com/LukedeMunk/[repository]
#
################################################################################
```

2. Imports
3. Constants
4. Global variables
5. Other functions

## Examples and other instructions

### 1. Use PascalCasing for class names:

```python
class DeviceManager:
################################################################################
#
#   @brief  Initializes class.
#
################################################################################
    def __init__(self):
        if self._initialized:
            return
```

### 2. Use snake_case for methods and variables:

```python
################################################################################
#
#   @brief  Returns a user.
#
################################################################################
def get_user():
    return user
```

### 3. Use spaces around operators ( = + / * ), and after commas

```python
# Correct
x = y + z
values = ["Volvo", "Saab", "Fiat"]

# Avoid
x=y+z
values=["Volvo","Saab","Fiat"]
```

***Why: This makes it easier to read.***

### 4. Use 4 spaces for indentation of code blocks

```python
def to_celsius(fahrenheit):
    return (5 / 9) * (fahrenheit - 32)
```

***Why: Do not use tabs (tabulators) for indentation. Text editors interpret tabs differently.***

### 5. Do not use Hungarian notation or any other type identification in identifiers

```python
# Correct
counter = 0
name = "Test"
 
# Avoid
i_counter = 0
str_name = "Test"
```

***Why: IDEs make it easy to see what type a variable is. In general, you want to avoid type indicators in any identifier. Python is a typeless language.***

### 6. Use comment headers for every method and align single line comments

> This implicates that the line length of code < 80 characters. If a statement does not fit on one line, the best place to break it is after an operator or a comma.

```python
# Correct
################################################################################
#
#   @brief    Looks if the specified character is in the keyword.
#   @param    keyword             String to search
#   @param    character           Character to find
#   @returns  int                 Index of the character, -1 when not found
#
################################################################################
def look_for_character(keyword, character):
    if keyword[0] == character                                                 #If character...
        pass
    return index;                                                               #return...

# Avoid
def look_for_character(keyword, character):
    if keyword[0] == character #If character..
        pass
    return index; #return...
```

***Why: This makes it easier to read and look for methods in big files.***

### 7. Use meaningful names for variables. The following example uses seattleCustomers for customers who are located in Seattle:

```python
seattle_customers = {0*10}
if customer.city == "Seattle":
    seattle_customers[0] = customer.id
```

### 8. Avoid using abbreviations. Exceptions: abbreviations commonly used as names, such as Id, Xml, Ftp, Uri.

```python    
# Correct
UserGroup user_group
Assignment employee_assignment

# Avoid
UserGroup usr_grp
Assignment emp_assign

# Exceptions
CustomerId customer_id
XmlDocument xml_document
FtpHelper ftp_helper
UriPart uri_part
```

***Why: Prevents inconsistent abbreviations.***

### 9. Use noun or noun phrases to name a class. 

```python 
class Employee:

class BusinessLocation:

class DocumentCollection:
```

***Why: Easy to remember.***

### 10. Organize classes with a clearly defined structure: 

```python 
# Examples
Company.Technology.Feature.Subnamespace
Company.Product.Module.SubModule
Product.Module.Component
```

***Why: Maintains good organization of the code base.***

### 11. Use prefix `any`, `is`, `has` or similar keywords for boolean identifier:

```python 
# Example
def is_zero(value):
    return value == 0
```

***Why: Easy to read and understand.***

## Reference

- [MSDN General Naming Conventions](http://msdn.microsoft.com/en-us/library/ms229045(v=vs.110).aspx)
- [MSDN Naming Guidelines](http://msdn.microsoft.com/en-us/library/xzf533w0%28v=vs.71%29.aspx)
- [MSDN Framework Design Guidelines](http://msdn.microsoft.com/en-us/library/ms229042.aspx)