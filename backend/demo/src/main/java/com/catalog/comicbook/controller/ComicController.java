package com.catalog.comicbook.controller;

import com.catalog.comicbook.ComicRepository.ComicRepository;
import com.catalog.comicbook.model.Comic;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/comics")
public class ComicController {

    private final ComicRepository repo;

    public ComicController(ComicRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Comic> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Comic create(@RequestBody Comic comic) {
        return repo.save(comic);
    }
}