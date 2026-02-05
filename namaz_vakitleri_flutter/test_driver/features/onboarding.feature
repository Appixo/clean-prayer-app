# Production E2E: Onboarding, Utrecht, Settings, Dini Günler.
# Implementation: .maestro/production_check.yaml

Feature: Onboarding and Full Flow
  As a new user I want to complete onboarding and use the app so I can see prayer times for my city.

  Scenario: Complete onboarding with city search
    Given the app is launched with clear state
    When permission prompts appear
    Then I tap Allow to grant permissions
    And the onboarding screen shows "Konumunuz"
    When I tap "Şehir Ara"
    And I search for "Utrecht"
    And I select "Utrecht" from results
    Then the home screen shows prayer times for Utrecht

  Scenario: Settings and Dini Günler
    Given the home screen shows "Namaz Vakitleri"
    When I tap "Ayarlar"
    Then the Settings screen shows "Ezan Sesi"
    When I tap "Dini Günler"
    Then the Dini Günler screen is visible
    And "Diyanet" is visible
