package org.example.smartparking.repository;

import org.example.smartparking.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(w.balance), 0) FROM Wallet w")
    Double getTotalBalance();
}

