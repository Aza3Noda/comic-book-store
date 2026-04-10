package com.catalog.comicbook.model;

import jakarta.persistence.*;

@Entity
public class Comic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private float price;
    private int pages;
    private String description;
    private String characters;
    private String imageUrl;
    private boolean stock;

    // Required by JPA
    public Comic() {}

    public Comic(String title, String author, float price, int pages,
                 String description, String characters, String imageUrl, boolean stock) {
        this.title = title;
        this.author = author;
        this.price = price;
        this.pages = pages;
        this.description = description;
        this.characters = characters;
        this.imageUrl = imageUrl;
        this.stock = stock;
    }

    public Long getId()                     { return id; }
    public String getTitle()                { return title; }
    public void setTitle(String title)      { this.title = title; }
    public String getAuthor()               { return author; }
    public void setAuthor(String author)    { this.author = author; }
    public float getPrice()                 { return price; }
    public void setPrice(float price)       { this.price = price; }
    public int getPages()                   { return pages; }
    public void setPages(int pages)         { this.pages = pages; }
    public String getDescription()          { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCharacters()           { return characters; }
    public void setCharacters(String characters)   { this.characters = characters; }
    public String getImageUrl()             { return imageUrl; }
    public void setImageUrl(String imageUrl)       { this.imageUrl = imageUrl; }
    public boolean isStock()                { return stock; }
    public void setStock(boolean stock)     { this.stock = stock; }
}
