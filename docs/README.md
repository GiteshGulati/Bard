# Documentation index

Start with the [project README](../README.md) for prerequisites and local setup.

- [Architecture](architecture.md): application structure, request flow, trust boundaries, and background work.
- [Project structure](project-structure.md): repository tree, canonical and legacy clients, and script/test locations.
- [API reference](api.md): route inventory, access expectations, common response envelopes, and browser security requirements.
- [Environment configuration](environment.md): every server setting, defaults, and conditional requirements.
- [Data model](data-model.md): collections, core fields, relationships, and important indexes.
- [Operations and deployment](operations.md): production checklist, MongoDB Atlas, Cloudinary, and Gmail SMTP setup.
- [Troubleshooting](troubleshooting.md): common local, integration, and runtime problems.
- [Testing](testing.md): supported test commands, isolation, and coverage limits.
- [Contributing](contributing.md): change and review workflow.

The canonical UI is `bard-react/`. `client/` is a legacy standalone frontend and is not part of root build or server static serving.
