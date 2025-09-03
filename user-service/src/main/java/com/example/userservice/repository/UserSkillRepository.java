package com.example.userservice.repository;

import com.example.userservice.model.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    
    List<UserSkill> findByUserId(Long userId);
    
    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill WHERE us.userId = :userId ORDER BY us.skill.category, us.skill.name")
    List<UserSkill> findByUserIdWithSkill(@Param("userId") Long userId);
    
    Optional<UserSkill> findByUserIdAndSkillId(Long userId, Long skillId);
    
    boolean existsByUserIdAndSkillId(Long userId, Long skillId);
    
    @Modifying
    void deleteByUserIdAndSkillId(Long userId, Long skillId);
    
    @Modifying
    void deleteByUserId(Long userId);
}