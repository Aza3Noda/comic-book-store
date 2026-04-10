package com.catalog.comicbook.controller;

import com.catalog.comicbook.ComicRepository.ComicRepository;
import com.catalog.comicbook.model.Comic;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/comics")
public class ComicController {

    private final ComicRepository repo;

    public ComicController(ComicRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Comic> getAll(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return repo.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(search, search);
        }
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comic> getById(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Comic create(@RequestBody Comic comic) {
        return repo.save(comic);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comic> update(@PathVariable Long id, @RequestBody Comic updated) {
        return repo.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setAuthor(updated.getAuthor());
            existing.setPrice(updated.getPrice());
            existing.setPages(updated.getPages());
            existing.setDescription(updated.getDescription());
            existing.setCharacters(updated.getCharacters());
            existing.setImageUrl(updated.getImageUrl());
            existing.setStock(updated.isStock());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}