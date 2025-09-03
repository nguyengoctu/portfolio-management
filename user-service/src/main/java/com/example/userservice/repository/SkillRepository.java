package com.example.userservice.repository;

import com.example.userservice.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    
    Optional<Skill> findByName(String name);
    
    List<Skill> findByCategory(String category);
    
    @Query("SELECT DISTINCT s.category FROM Skill s WHERE s.category IS NOT NULL ORDER BY s.category")
    List<String> findAllCategories();
    
    @Query("SELECT s FROM Skill s ORDER BY s.category, s.name")
    List<Skill> findAllOrderByCategoryAndName();
}