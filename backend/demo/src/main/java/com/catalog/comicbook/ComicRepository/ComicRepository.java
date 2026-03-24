package com.catalog.comicbook.ComicRepository;
import com.catalog.comicbook.model.Comic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComicRepository extends JpaRepository<Comic, Long> {
}