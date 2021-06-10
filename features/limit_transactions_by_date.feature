Feature: Limit transactions by date

    Lets you strip away the transactions that
    you have already imported previously

    Background:
        Given all patterns are recorded in `patterns.json`

    Scenario: Patterns file and valid csv file provided with date limit
        Given I provide a valid csv file path
        And I'm using a debit account
        And I want to exclude transactions before "<date>"
        When I run the application with given parameters
        Then I will get a tsv file in the same directory
        And the file will only have transactions after "<date>"

        Examples:
            | date       |
            | 01/03/2021 |
            | 01/04/2021 |
            | 20/03/2021 |
            | 01/05/2021 |