package com.erp.studenterp.repository;

import com.erp.studenterp.entity.TransportRoute;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportRouteRepository extends JpaRepository<TransportRoute, Long> {

    Optional<TransportRoute> findByIdAndActiveTrue(Long id);

    List<TransportRoute> findByActiveTrueOrderByRouteCodeAsc();

    boolean existsByRouteCodeIgnoreCase(String routeCode);

    boolean existsByRouteCodeIgnoreCaseAndIdNot(String routeCode, Long id);
}
