package com.erp.studenterp.repository;

import com.erp.studenterp.entity.TransportStop;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportStopRepository extends JpaRepository<TransportStop, Long> {

    Optional<TransportStop> findByIdAndActiveTrue(Long id);

    List<TransportStop> findByRouteIdAndActiveTrueOrderByPickupTimeAscStopNameAsc(Long routeId);
}
