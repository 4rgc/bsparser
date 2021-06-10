Feature: Convert Scotiabank transactions to importable file

    Allows to get an importable tsv file, from a csv file, exported from Scotiabank.

    Background:
        Given all patterns are recorded in `patterns.json`

    Scenario: Patterns file and valid csv file provided
        Given I provide a valid csv file path
        And I'm using a debit account
        And I want to include all transactions
        When I run the application with given parameters
        Then I will get a tsv file in the same directory
        And it will have all transactions