# Historical Development Note

This document records an earlier development state and is retained for project history.
For the current implementation, see [README.md](../README.md), [final AI implementation](AI_IMPLEMENTATION_SUMMARY.md) and the [documentation index](README.md). Dates, test counts, file status and earlier configuration below describe that earlier pass, not the current submission state.

---


Yuxuan Lu - AI Development Report
Completed Work
I researched the Gemini API and requested an API key for the project. We plan to use Gemini 3.5 Flash-Lite because it is fast, affordable, and suitable for processing job descriptions.

AI Future Plan
The AI feature will:
Summarize job descriptions.
Extract important skills and requirements.
Compare job requirements with student skills.
Recommend useful CV keywords.
Generate interview practice questions.
Allow students to edit and save AI-generated content.
The Gemini API key will be stored securely on the server and will not be exposed in the browser. All AI-generated content will be clearly labelled and checked by the user before it is saved or used.

Zeya Su - Database and Dataset Report

Completed Work

I set up MongoDB Atlas and connected it to the project through a secure server-side connection string. The database URL is stored in an environment file and is not included in the public source code. I also tested the connection by adding and reading application records through the project API.

Dataset

I created a small sample dataset with internship applications from companies such as Xero, Datacom, Air New Zealand, Canva, and Fisher & Paykel Healthcare. The records use different locations, deadlines, and application statuses so we can test the dashboard, filters, calendar, and application pipeline.

Simple Data Model

The main Application model contains:

- Organisation name
- Role title
- Location
- Job-posting link
- Application deadline
- Application status
- Job description
- Contact person
- Outcome
- Personal notes
- Created and updated dates

Future Plan

We will connect each application to a student User ID. We also plan to add Interview, DocumentLink, and AISummary models. These records will be linked to the related application so that each student's information remains organised.
